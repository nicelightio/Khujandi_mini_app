import { createDeliveryAssignmentModule } from "../slices/delivery-assignment/presentation/delivery-assignment.module";
import { createDeliveryTrackingModule } from "../slices/delivery-tracking/presentation/delivery-tracking.module";
import { createOrderCancellationModule } from "../slices/order-cancellation/presentation/order-cancellation.module";
import type { CheckoutPaymentOrderRecord, CheckoutPaymentUserRecord } from "../slices/checkout-payment/domain/checkout-payment.types";
import type { DeliveryAssignmentPrismaProvider } from "../slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
import type { DeliveryTrackingPrismaProvider } from "../slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository";
import type { OrderCancellationPrismaProvider } from "../slices/order-cancellation/infrastructure/prisma-order-cancellation.repository";
import type { CheckoutPaymentRuntimeState } from "./checkout-payment-runtime";

type RuntimeOrderMetadata = {
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date | null;
  cancelledByUserId: string | null;
  cancellationReasonCode: string | null;
  cancelledAt: Date | null;
};

type OperationalRuntimeState = {
  orderMetadata: Map<string, RuntimeOrderMetadata>;
  courierAvailability: Map<string, RuntimeCourierAvailabilityRecord>;
  assignmentOffers: RuntimeAssignmentOfferRecord[];
  statusHistory: RuntimeStatusHistoryRecord[];
  events: RuntimeEventRecord[];
  nextAssignmentOfferId: bigint;
  nextStatusHistoryId: bigint;
  nextAssignmentAuditId: bigint;
  nextCancellationAuditId: bigint;
  nextEventId: bigint;
};

type RuntimeCourierAvailabilityRecord = {
  acceptingOrdersUntil: Date | null;
  autoOfferEnabled: boolean;
  ratingScore: number;
};

type RuntimeEventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

type RuntimeStatusHistoryRecord = {
  id: bigint;
  orderId: string;
  oldStatus: string;
  newStatus: string;
  changedByUserId: string;
  changedByRole?: string;
  changedByName?: string;
  changedAt: Date;
};

type RuntimeAssignmentOfferRecord = {
  id: string;
  orderId: string;
  targetCourierId: string | null;
  kind: "MANUAL" | "BROADCAST";
  status: "PENDING" | "CLAIMED" | "EXPIRED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
};

type OperatorDeliverySeverity =
  | "delayed"
  | "cancelled"
  | "completed"
  | "unassigned"
  | "active_under_30"
  | "active_30_60"
  | "active_60_plus"
  | "attention";

const DEFAULT_OPERATIONAL_USERS: CheckoutPaymentUserRecord[] = [
  {
    id: "courier-7",
    telegramId: "70007",
    role: "courier",
    name: "Courier 7",
    username: "courier7",
    language: "ru",
    isActive: true,
  },
  {
    id: "courier-8",
    telegramId: "70008",
    role: "courier",
    name: "Courier 8",
    username: "courier8",
    language: "ru",
    isActive: true,
  },
  {
    id: "client-demo-1",
    telegramId: "80001",
    role: "client",
    name: "Client Demo",
    username: "clientdemo",
    language: "ru",
    isActive: true,
  },
];

const DEFAULT_OPERATIONAL_ORDERS: CheckoutPaymentOrderRecord[] = [
  {
    id: "order-created-1001",
    shopId: "shop-demo-1",
    shopNameSnapshot: "Demo Shop",
    sellerId: "seller-demo-1",
    clientId: "client-demo-1",
    courierId: null,
    status: "CREATED",
    itemsTotalMinor: 12000,
    deliveryFeeMinor: 1500,
    totalAmountMinor: 13500,
    paymentProvider: "demo-provider",
    paymentProviderTxId: "demo-payment-created-1001",
    telegramPaymentChargeId: null,
    providerPaymentChargeId: null,
    paymentStatus: "PAID",
    refundStatus: "NOT_REQUIRED",
    refundNote: null,
    isDeleted: false,
  },
  {
    id: "order-in-progress-2004",
    shopId: "shop-demo-1",
    shopNameSnapshot: "Demo Shop",
    sellerId: "seller-demo-1",
    clientId: "client-demo-1",
    courierId: "courier-7",
    status: "IN_PROGRESS",
    itemsTotalMinor: 17500,
    deliveryFeeMinor: 2000,
    totalAmountMinor: 19500,
    paymentProvider: "demo-provider",
    paymentProviderTxId: "demo-payment-in-progress-2004",
    telegramPaymentChargeId: null,
    providerPaymentChargeId: null,
    paymentStatus: "PAID",
    refundStatus: "NOT_REQUIRED",
    refundNote: null,
    isDeleted: false,
  },
];

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

const ensureOperationalUser = (state: CheckoutPaymentRuntimeState, user: CheckoutPaymentUserRecord) => {
  if (state.users.some((candidate) => candidate.id === user.id)) {
    return;
  }

  state.users.push({ ...user });
};

const ensureOperationalOrder = (state: CheckoutPaymentRuntimeState, order: CheckoutPaymentOrderRecord) => {
  if (state.orders.some((candidate) => candidate.id === order.id)) {
    return;
  }

  state.orders.push({ ...order });
};

const ensureOrderMetadata = (
  runtimeState: OperationalRuntimeState,
  state: CheckoutPaymentRuntimeState,
  orderId: string,
  nowFactory: () => Date,
): RuntimeOrderMetadata | null => {
  const order = state.orders.find((candidate) => candidate.id === orderId);

  if (order === undefined) {
    return null;
  }

  const existing = runtimeState.orderMetadata.get(orderId);

  if (existing !== undefined) {
    return existing;
  }

  const created = {
    createdAt: nowFactory(),
    updatedAt: nowFactory(),
    assignedAt: null,
    cancelledByUserId: null,
    cancellationReasonCode: null,
    cancelledAt: null,
  };
  runtimeState.orderMetadata.set(orderId, created);
  return created;
};

const findOrder = (
  state: CheckoutPaymentRuntimeState,
  runtimeState: OperationalRuntimeState,
  orderId: string,
  nowFactory: () => Date,
) => {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  const metadata = ensureOrderMetadata(runtimeState, state, orderId, nowFactory);

  if (order === undefined || metadata === null) {
    return null;
  }

  return {
    order,
    metadata,
  };
};

const toAssignmentOrderRecord = (
  state: CheckoutPaymentRuntimeState,
  runtimeState: OperationalRuntimeState,
  orderId: string,
  nowFactory: () => Date,
) => {
  const resolved = findOrder(state, runtimeState, orderId, nowFactory);

  if (resolved === null) {
    return null;
  }

  return {
    id: resolved.order.id,
    courierId: resolved.order.courierId,
    status: resolved.order.status,
    updatedAt: cloneDate(resolved.metadata.updatedAt) as Date,
    isDeleted: resolved.order.isDeleted,
  };
};

const toCancellationOrderRecord = (
  state: CheckoutPaymentRuntimeState,
  runtimeState: OperationalRuntimeState,
  orderId: string,
  nowFactory: () => Date,
) => {
  const resolved = findOrder(state, runtimeState, orderId, nowFactory);

  if (resolved === null) {
    return null;
  }

  return {
    id: resolved.order.id,
    courierId: resolved.order.courierId,
    status: resolved.order.status,
    paymentStatus: resolved.order.paymentStatus,
    refundStatus: resolved.order.refundStatus,
    refundNote: resolved.order.refundNote,
    cancelledByUserId: resolved.metadata.cancelledByUserId,
    cancellationReasonCode: resolved.metadata.cancellationReasonCode,
    cancelledAt: cloneDate(resolved.metadata.cancelledAt),
    updatedAt: cloneDate(resolved.metadata.updatedAt) as Date,
    isDeleted: resolved.order.isDeleted,
  };
};

const createOperationalRuntimeState = (
  state: CheckoutPaymentRuntimeState,
  nowFactory: () => Date,
): OperationalRuntimeState => {
  const runtimeState: OperationalRuntimeState = {
    orderMetadata: new Map(),
    courierAvailability: new Map(),
    assignmentOffers: [],
    statusHistory: [],
    events: [],
    nextAssignmentOfferId: 1n,
    nextStatusHistoryId: 1n,
    nextAssignmentAuditId: 1n,
    nextCancellationAuditId: 1n,
    nextEventId: 1n,
  };

  for (const order of state.orders) {
    ensureOrderMetadata(runtimeState, state, order.id, nowFactory);
  }

  return runtimeState;
};

const ensureCourierAvailability = (
  runtimeState: OperationalRuntimeState,
  userId: string,
): RuntimeCourierAvailabilityRecord => {
  const existing = runtimeState.courierAvailability.get(userId);

  if (existing !== undefined) {
    return existing;
  }

  const created = {
    acceptingOrdersUntil: null,
    autoOfferEnabled: false,
    ratingScore: 0,
  };
  runtimeState.courierAvailability.set(userId, created);
  return created;
};

const createRuntimeEvent = (
  runtimeState: OperationalRuntimeState,
  nowFactory: () => Date,
  data: Omit<RuntimeEventRecord, "id" | "createdAt">,
): RuntimeEventRecord => {
  const event = {
    id: runtimeState.nextEventId++,
    ...data,
    createdAt: nowFactory(),
  };

  runtimeState.events.push(event);
  return event;
};

const createRuntimeStatusHistory = (
  runtimeState: OperationalRuntimeState,
  data: Omit<RuntimeStatusHistoryRecord, "id">,
): RuntimeStatusHistoryRecord => {
  const statusHistory = {
    id: runtimeState.nextStatusHistoryId++,
    ...data,
  };

  runtimeState.statusHistory.push(statusHistory);
  return statusHistory;
};

const createRuntimeAssignmentOffer = (
  runtimeState: OperationalRuntimeState,
  nowFactory: () => Date,
  data: Omit<RuntimeAssignmentOfferRecord, "id" | "updatedAt"> & { id?: string },
): RuntimeAssignmentOfferRecord => {
  const offer = {
    id: data.id ?? `offer-${runtimeState.nextAssignmentOfferId++}`,
    ...data,
    updatedAt: nowFactory(),
  };

  runtimeState.assignmentOffers.push(offer);
  return offer;
};

const resetOperationalRuntimeState = (
  runtimeState: OperationalRuntimeState,
  state: CheckoutPaymentRuntimeState,
  nowFactory: () => Date,
): void => {
  runtimeState.orderMetadata.clear();
  runtimeState.courierAvailability.clear();
  runtimeState.assignmentOffers.splice(0, runtimeState.assignmentOffers.length);
  runtimeState.statusHistory.splice(0, runtimeState.statusHistory.length);
  runtimeState.events.splice(0, runtimeState.events.length);
  runtimeState.nextAssignmentOfferId = 1n;
  runtimeState.nextStatusHistoryId = 1n;
  runtimeState.nextAssignmentAuditId = 1n;
  runtimeState.nextCancellationAuditId = 1n;
  runtimeState.nextEventId = 1n;

  for (const order of state.orders) {
    ensureOrderMetadata(runtimeState, state, order.id, nowFactory);
  }
};

const startOfLocalDay = (value: Date): Date => {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  return start;
};

const computeOperatorSeverity = (input: {
  status: string;
  courierId: string | null;
  createdAt: Date;
  now: Date;
}): OperatorDeliverySeverity => {
  if (input.status === "DELAYED") {
    return "delayed";
  }

  if (input.status === "CANCELLED_BY_ADMIN" || input.status === "CANCELLED_BY_COURIER_UNAVAILABLE") {
    return "cancelled";
  }

  if (input.status === "COMPLETED") {
    return "completed";
  }

  if (input.courierId === null) {
    return "unassigned";
  }

  if (input.status === "DELIVERED") {
    return "attention";
  }

  const ageMinutes = Math.max(0, input.now.getTime() - input.createdAt.getTime()) / 60000;

  if (ageMinutes >= 60) {
    return "active_60_plus";
  }

  if (ageMinutes >= 30) {
    return "active_30_60";
  }

  return "active_under_30";
};

const serializeRuntimeStatusHistory = (
  history: RuntimeStatusHistoryRecord,
  createdAt: Date,
  state: CheckoutPaymentRuntimeState,
) => {
  const actor = state.users.find((candidate) => candidate.id === history.changedByUserId);
  const actorRole = history.changedByRole ?? actor?.role ?? (history.changedByUserId.startsWith("admin") ? "admin" : "operator");
  const actorName = history.changedByName ?? actor?.name ?? history.changedByUserId;

  return {
    id: history.id.toString(),
    status: history.newStatus,
    previousStatus: history.oldStatus,
    changedAt: history.changedAt.toISOString(),
    actor: {
      userId: history.changedByUserId,
      role: actorRole,
      name: actorName,
    },
    timeInStatusSeconds: null,
    timeSinceOrderCreatedSeconds: Math.max(0, Math.floor((history.changedAt.getTime() - createdAt.getTime()) / 1000)),
    comments: {
      courier: null,
      admin: null,
      customer: null,
      shopOwner: null,
    },
  };
};

export const ensureOperationalRuntimeBaseline = (state: CheckoutPaymentRuntimeState) => {
  for (const user of DEFAULT_OPERATIONAL_USERS) {
    ensureOperationalUser(state, user);
  }

  for (const order of DEFAULT_OPERATIONAL_ORDERS) {
    ensureOperationalOrder(state, order);
  }
};

export const createOperationalRuntimeModules = (
  state: CheckoutPaymentRuntimeState,
  options: {
    now?: () => Date;
  } = {},
) => {
  const nowFactory = options.now ?? (() => new Date());
  const runtimeState = createOperationalRuntimeState(state, nowFactory);

  const listOperatorDeliveryOrders = () => {
    const now = nowFactory();
    const windowStart = startOfLocalDay(now);
    windowStart.setDate(windowStart.getDate() - 3);
    const windowEnd = new Date(now);

    const orders = state.orders
      .map((order) => {
        const metadata = ensureOrderMetadata(runtimeState, state, order.id, nowFactory);

        if (metadata === null || order.isDeleted) {
          return null;
        }

        if (metadata.createdAt.getTime() < windowStart.getTime() || metadata.createdAt.getTime() > windowEnd.getTime()) {
          return null;
        }

        const courier = order.courierId === null ? null : state.users.find((candidate) => candidate.id === order.courierId) ?? null;
        const orderHistory = runtimeState.statusHistory
          .filter((history) => history.orderId === order.id)
          .sort((left, right) => left.changedAt.getTime() - right.changedAt.getTime())
          .map((history) => serializeRuntimeStatusHistory(history, metadata.createdAt, state));
        const assignedHistory = runtimeState.statusHistory.find(
          (history) => history.orderId === order.id && history.newStatus === "ASSIGNED",
        );
        const latestEvent = [...runtimeState.events].reverse().find((event) => event.entityId === order.id);

        return {
          orderId: order.id,
          publicOrderNumber: order.id,
          summary: {
            shopName: order.shopNameSnapshot,
            totalAmountMinor: order.totalAmountMinor,
            currency: "TJS",
          },
          createdAt: metadata.createdAt.toISOString(),
          updatedAt: metadata.updatedAt.toISOString(),
          status: order.status,
          severity: computeOperatorSeverity({
            status: order.status,
            courierId: order.courierId,
            createdAt: metadata.createdAt,
            now,
          }),
          courier: {
            marker: order.courierId === null ? "absent" : "current",
            current:
              order.courierId === null
                ? null
                : {
                    id: order.courierId,
                    name: courier?.name ?? order.courierId,
                    telegramId: courier?.telegramId ?? null,
                  },
          },
          assignedAt: (metadata.assignedAt ?? assignedHistory?.changedAt ?? null)?.toISOString() ?? null,
          claimedAt: (metadata.assignedAt ?? assignedHistory?.changedAt ?? null)?.toISOString() ?? null,
          latestMessage: null,
          latestMessagePreview: null,
          latestMessageSenderRole: null,
          statusRevision: latestEvent?.id.toString() ?? "0",
          history: orderHistory,
        };
      })
      .filter((order): order is NonNullable<typeof order> => order !== null)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      window: {
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
      },
      generatedAt: now.toISOString(),
      revision: (runtimeState.nextEventId - 1n).toString(),
      orders,
    };
  };

  const deliveryAssignmentClient: DeliveryAssignmentPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) => toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory),
      findFirst: async ({ where }) => {
        const order = state.orders.find(
          (candidate) =>
            candidate.courierId === where.courierId &&
            candidate.isDeleted === where.isDeleted &&
            where.status.in.some((status) => status === candidate.status),
        );

        return order === undefined ? null : { id: order.id };
      },
      update: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          throw new Error(`Unknown order ${where.id}`);
        }

        resolved.order.courierId = data.courierId;
        resolved.order.status = data.status;
        resolved.metadata.updatedAt = nowFactory();
        resolved.metadata.assignedAt = resolved.metadata.updatedAt;

        return toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory)!;
      },
      updateMany: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          return { count: 0 };
        }

        if ("courierId" in where && resolved.order.courierId !== where.courierId) {
          return { count: 0 };
        }

        if (resolved.order.isDeleted !== where.isDeleted) {
          return { count: 0 };
        }

        const statusMatches =
          typeof where.status === "string"
            ? resolved.order.status === where.status
            : where.status.in.some((status) => status === resolved.order.status);

        if (!statusMatches) {
          return { count: 0 };
        }

        if (data.courierId !== undefined) {
          resolved.order.courierId = data.courierId;
        }
        resolved.order.status = data.status;
        resolved.metadata.updatedAt = nowFactory();
        if (data.status === "ASSIGNED") {
          resolved.metadata.assignedAt = resolved.metadata.updatedAt;
        }

        return { count: 1 };
      },
    },
    user: {
      findUnique: async ({ where }) => {
        const user = state.users.find((candidate) => candidate.id === where.id);

        if (user === undefined) {
          return null;
        }

        const availability = ensureCourierAvailability(runtimeState, user.id);

        return {
          id: user.id,
          telegramId: user.telegramId,
          role: user.role,
          isActive: user.isActive,
          acceptingOrdersUntil: cloneDate(availability.acceptingOrdersUntil),
          autoOfferEnabled: availability.autoOfferEnabled,
          ratingScore: availability.ratingScore,
          name: user.name,
        };
      },
      findMany: async ({ where }) =>
        state.users
          .filter((user) => {
            if (typeof where.role === "object") {
              return (
                where.role.in.map((role) => role.toLowerCase()).includes(user.role) &&
                user.isActive === where.isActive
              );
            }

            if (user.role !== where.role.toLowerCase()) {
              return false;
            }

            if (user.isActive !== where.isActive) {
              return false;
            }

            const availability = ensureCourierAvailability(runtimeState, user.id);

            if (availability.autoOfferEnabled !== where.autoOfferEnabled) {
              return false;
            }

            const cutoff = (where.OR[1] as { acceptingOrdersUntil: { gt: Date } }).acceptingOrdersUntil.gt;
            return (
              availability.acceptingOrdersUntil === null ||
              availability.acceptingOrdersUntil.getTime() > cutoff.getTime()
            );
          })
          .map((user) => {
            const availability = ensureCourierAvailability(runtimeState, user.id);

            return {
              id: user.id,
              telegramId: user.telegramId,
              role: user.role,
              isActive: user.isActive,
              acceptingOrdersUntil: cloneDate(availability.acceptingOrdersUntil),
              autoOfferEnabled: availability.autoOfferEnabled,
              ratingScore: availability.ratingScore,
              name: user.name,
            };
          }),
      update: async ({ where, data }) => {
        const user = state.users.find((candidate) => candidate.id === where.id);

        if (user === undefined) {
          throw new Error(`Unknown user ${where.id}`);
        }

        if (data.isActive !== undefined) {
          user.isActive = data.isActive;
        }

        const availability = ensureCourierAvailability(runtimeState, user.id);

        if ("acceptingOrdersUntil" in data) {
          availability.acceptingOrdersUntil = cloneDate(data.acceptingOrdersUntil ?? null);
        }

        if (data.autoOfferEnabled !== undefined) {
          availability.autoOfferEnabled = data.autoOfferEnabled;
        }

        if (data.ratingScore !== undefined) {
          availability.ratingScore -= data.ratingScore.decrement;
        }

        return {
          id: user.id,
          telegramId: user.telegramId,
          role: user.role,
          isActive: user.isActive,
          acceptingOrdersUntil: cloneDate(availability.acceptingOrdersUntil),
          autoOfferEnabled: availability.autoOfferEnabled,
          ratingScore: availability.ratingScore,
          name: user.name,
        };
      },
    },
    assignmentOffer: {
      findUnique: async ({ where }) =>
        runtimeState.assignmentOffers.find((offer) => offer.id === where.id) ?? null,
      findMany: async ({ where }) =>
        runtimeState.assignmentOffers.filter((offer) => {
          if (where.id !== undefined && offer.id !== where.id) {
            return false;
          }

          if (where.orderId !== undefined && offer.orderId !== where.orderId) {
            return false;
          }

          if (where.targetCourierId !== undefined && offer.targetCourierId !== where.targetCourierId) {
            return false;
          }

          if (where.status !== undefined && offer.status !== where.status) {
            return false;
          }

          if (
            where.createdAt !== undefined &&
            offer.createdAt.getTime() > where.createdAt.lte.getTime()
          ) {
            return false;
          }

          return true;
        }),
      create: async ({ data }) =>
        createRuntimeAssignmentOffer(runtimeState, nowFactory, {
          orderId: data.orderId,
          targetCourierId: data.targetCourierId,
          kind: data.kind,
          status: data.status,
          createdAt: data.createdAt,
        }),
      updateMany: async ({ where, data }) => {
        let count = 0;

        for (const offer of runtimeState.assignmentOffers) {
          if (where.orderId !== undefined && offer.orderId !== where.orderId) {
            continue;
          }

          if (where.status !== undefined && offer.status !== where.status) {
            continue;
          }

          if (typeof where.id === "string" && offer.id !== where.id) {
            continue;
          }

          if (typeof where.id === "object" && offer.id === where.id.not) {
            continue;
          }

          offer.status = data.status;
          offer.updatedAt = nowFactory();
          count += 1;
        }

        return { count };
      },
    },
    orderStatusHistory: {
      create: async ({ data }) => createRuntimeStatusHistory(runtimeState, data),
    },
    deliveryAssignmentAudit: {
      create: async ({ data }) => ({
        id: runtimeState.nextAssignmentAuditId++,
        ...data,
      }),
    },
    event: {
      create: async ({ data }) => createRuntimeEvent(runtimeState, nowFactory, data),
      findMany: async ({ where }) =>
        runtimeState.events.filter((event) => {
          if (event.entity !== where.entity) {
            return false;
          }

          if (where.entityId !== undefined && event.entityId !== where.entityId) {
            return false;
          }

          if (where.type !== undefined && !where.type.in.includes(event.type)) {
            return false;
          }

          return true;
        }) as never,
    },
    $transaction: async (callback) => callback(deliveryAssignmentClient),
  };

  const orderCancellationClient: OrderCancellationPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) => toCancellationOrderRecord(state, runtimeState, where.id, nowFactory),
      update: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          throw new Error(`Unknown order ${where.id}`);
        }

        if ("status" in data) {
          resolved.order.status = data.status;
          resolved.order.refundStatus = data.refundStatus;
          resolved.order.refundNote = data.refundNote;
          resolved.metadata.cancelledByUserId = data.cancelledByUserId;
          resolved.metadata.cancellationReasonCode = data.cancellationReasonCode;
          resolved.metadata.cancelledAt = cloneDate(data.cancelledAt);
        } else {
          resolved.order.refundStatus = data.refundStatus;
          resolved.order.refundNote = data.refundNote;
        }

        resolved.metadata.updatedAt = nowFactory();
        return toCancellationOrderRecord(state, runtimeState, where.id, nowFactory)!;
      },
      updateMany: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          return { count: 0 };
        }

        if (where.refundStatus !== undefined && resolved.order.refundStatus !== where.refundStatus) {
          return { count: 0 };
        }

        if (where.status !== undefined && resolved.order.status !== where.status) {
          return { count: 0 };
        }

        if (where.isDeleted !== undefined && resolved.order.isDeleted !== where.isDeleted) {
          return { count: 0 };
        }

        if ("status" in data) {
          resolved.order.status = data.status;
          resolved.order.refundStatus = data.refundStatus;
          resolved.order.refundNote = data.refundNote;
          resolved.metadata.cancelledByUserId = data.cancelledByUserId;
          resolved.metadata.cancellationReasonCode = data.cancellationReasonCode;
          resolved.metadata.cancelledAt = cloneDate(data.cancelledAt);
        } else {
          resolved.order.refundStatus = data.refundStatus;
          resolved.order.refundNote = data.refundNote;
        }

        resolved.metadata.updatedAt = nowFactory();
        return { count: 1 };
      },
    },
    orderStatusHistory: {
      create: async ({ data }) => createRuntimeStatusHistory(runtimeState, data),
    },
    orderCancellationAudit: {
      create: async ({ data }) => ({
        id: runtimeState.nextCancellationAuditId++,
        ...data,
      }),
    },
    event: {
      create: async ({ data }) => createRuntimeEvent(runtimeState, nowFactory, data),
    },
    $transaction: async (callback) => callback(orderCancellationClient),
  };

  const deliveryTrackingClient: DeliveryTrackingPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) => toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory),
      update: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          throw new Error(`Unknown order ${where.id}`);
        }

        resolved.order.status = data.status;
        resolved.metadata.updatedAt = nowFactory();
        return toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory)!;
      },
    },
    orderStatusHistory: {
      create: async ({ data }) => createRuntimeStatusHistory(runtimeState, data),
    },
    event: {
      create: async ({ data }) => {
        const event = createRuntimeEvent(runtimeState, nowFactory, data);
        const payload = event.payload;

        if (
          event.type === "order.status_changed" &&
          typeof payload.orderId === "string" &&
          typeof payload.changedByUserId === "string"
        ) {
          const latestHistory = [...runtimeState.statusHistory]
            .reverse()
            .find(
              (history) =>
                history.orderId === payload.orderId &&
                history.changedByUserId === payload.changedByUserId &&
                history.newStatus === payload.status,
            );

          if (latestHistory !== undefined) {
            latestHistory.changedByRole = typeof payload.changedByRole === "string" ? payload.changedByRole : undefined;
            latestHistory.changedByName = typeof payload.changedByName === "string" ? payload.changedByName : undefined;
          }
        }

        return event;
      },
      findMany: async ({ where }) => runtimeState.events.filter((event) => event.id > where.id.gt) as never,
    },
    user: {
      findUnique: async ({ where }) => {
        const user = state.users.find((candidate) => candidate.id === where.id);

        return user === undefined ? null : { telegramId: user.telegramId };
      },
    },
    $transaction: async (callback) => callback(deliveryTrackingClient),
  };

  return {
    deliveryAssignmentModule: createDeliveryAssignmentModule({
      client: deliveryAssignmentClient,
    }),
    deliveryTrackingModule: createDeliveryTrackingModule({
      client: deliveryTrackingClient,
    }),
    orderCancellationModule: createOrderCancellationModule({
      client: orderCancellationClient,
    }),
    resetRuntimeState: () => {
      resetOperationalRuntimeState(runtimeState, state, nowFactory);
    },
    getCurrentEventCursor: () => (runtimeState.nextEventId - 1n).toString(),
    listOperatorDeliveryOrders,
  };
};
