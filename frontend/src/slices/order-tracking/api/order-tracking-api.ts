export type OrderTrackingStatus = "ASSIGNED" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED";

export type OrderTrackingActionStatus = Exclude<OrderTrackingStatus, "ASSIGNED">;

export type OrderTrackingSession = {
  orderId: string;
  currentStatus: OrderTrackingStatus;
  initialCursor: string;
  availableActions: OrderTrackingActionStatus[];
};

export type OrderTrackingEvent = {
  type: "order.status_changed";
  entity: "order";
  entityId: string;
  payload: {
    orderId: string;
    previousStatus: OrderTrackingStatus;
    status: OrderTrackingStatus;
    changedByUserId: string;
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
    return {
      events: [],
      nextCursor: cursor,
    };
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
