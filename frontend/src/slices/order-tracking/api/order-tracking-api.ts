export type OrderTrackingStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type OrderTrackingActionStatus = "IN_PROGRESS" | "DELIVERED" | "COMPLETED";

export type OrderTrackingSession = {
  orderId: string;
  currentStatus: OrderTrackingStatus;
  initialCursor: string;
  availableActions: OrderTrackingActionStatus[];
  isReadOnly?: boolean;
};

export type OrderTrackingEvent = {
  type: "order.assigned" | "order.status_changed";
  entity: "order";
  entityId: string;
  payload: {
    orderId: string;
    previousStatus?: OrderTrackingStatus;
    status: OrderTrackingStatus;
    changedByUserId?: string;
    courierId?: string;
    assignedByUserId?: string;
    updatedAt: string;
  };
  revision: string;
  createdAt: string;
};

export type OrderTrackingPollResult = {
  events: OrderTrackingEvent[];
  nextCursor: string;
};

export type SubmitOrderTrackingActionInput = {
  orderId: string;
  nextStatus: OrderTrackingActionStatus;
};

export type SubmitOrderTrackingActionResult = {
  orderId: string;
  status: OrderTrackingStatus;
  revision: string;
  updatedAt: string;
  availableActions: OrderTrackingActionStatus[];
};

export type OrderTrackingApi = {
  loadTrackingSession: () => Promise<OrderTrackingSession>;
  pollEvents: (cursor: string) => Promise<OrderTrackingPollResult>;
  submitCourierAction: (
    input: SubmitOrderTrackingActionInput,
  ) => Promise<SubmitOrderTrackingActionResult>;
};

export class OrderTrackingApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  return JSON.parse(text) as unknown;
};

const parseStatus = (value: unknown): OrderTrackingStatus | null => {
  switch (value) {
    case "CREATED":
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "DELIVERED":
    case "COMPLETED":
    case "CANCELLED_BY_ADMIN":
    case "CANCELLED_BY_COURIER_UNAVAILABLE":
      return value;
    default:
      return null;
  }
};

const parseEvent = (value: unknown): OrderTrackingEvent | null => {
  if (!isRecord(value) || (value.type !== "order.assigned" && value.type !== "order.status_changed")) {
    return null;
  }

  const entityId = typeof value.entityId === "string" ? value.entityId : value.entity_id;
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : value.created_at;
  const payload = isRecord(value.payload) ? value.payload : null;
  const status = parseStatus(payload?.status);

  if (
    value.entity !== "order" ||
    typeof entityId !== "string" ||
    typeof value.revision !== "string" ||
    typeof createdAt !== "string" ||
    payload === null ||
    status === null ||
    typeof payload.orderId !== "string" ||
    typeof payload.updatedAt !== "string"
  ) {
    return null;
  }

  const previousStatus = parseStatus(payload.previousStatus);

  return {
    type: value.type,
    entity: "order",
    entityId,
    payload: {
      orderId: payload.orderId,
      previousStatus: previousStatus ?? undefined,
      status,
      changedByUserId:
        typeof payload.changedByUserId === "string" ? payload.changedByUserId : undefined,
      courierId: typeof payload.courierId === "string" ? payload.courierId : undefined,
      assignedByUserId: typeof payload.assignedByUserId === "string" ? payload.assignedByUserId : undefined,
      updatedAt: payload.updatedAt,
    },
    revision: value.revision,
    createdAt,
  };
};

export const parseOrderTrackingPollResult = (payload: unknown): OrderTrackingPollResult => {
  if (!isRecord(payload) || !Array.isArray(payload.events)) {
    throw new OrderTrackingApiError("POLLING_RESPONSE_INVALID", "Order tracking polling response is invalid.");
  }

  const nextCursor = typeof payload.nextCursor === "string" ? payload.nextCursor : payload.next_cursor;

  if (typeof nextCursor !== "string") {
    throw new OrderTrackingApiError("POLLING_CURSOR_INVALID", "Order tracking polling cursor is invalid.");
  }

  const events = payload.events.map(parseEvent).filter((event): event is OrderTrackingEvent => event !== null);

  return {
    events,
    nextCursor,
  };
};

const defaultSession: OrderTrackingSession = {
  orderId: "order-scaffold-1",
  currentStatus: "ASSIGNED",
  initialCursor: "0",
  availableActions: ["IN_PROGRESS"],
};

export const createOrderTrackingApi = (): OrderTrackingApi => ({
  async loadTrackingSession() {
    return defaultSession;
  },

  async pollEvents(cursor: string) {
    const params = new URLSearchParams({ since: cursor });
    const response = await fetch(`/api/v1/events?${params.toString()}`, {
      credentials: "same-origin",
    });
    const payload = await readJson(response);

    if (!response.ok) {
      throw new OrderTrackingApiError("POLLING_UNAVAILABLE", "Order tracking polling is temporarily unavailable.");
    }

    return parseOrderTrackingPollResult(payload);
  },

  async submitCourierAction(input) {
    return {
      orderId: input.orderId,
      status: input.nextStatus,
      revision: `scaffold:${input.nextStatus}`,
      updatedAt: new Date(0).toISOString(),
      availableActions: [],
    };
  },
});
