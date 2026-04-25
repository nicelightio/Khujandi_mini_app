import { createDeliveryAssignmentModule } from "../slices/delivery-assignment/presentation/delivery-assignment.module";
import { createOrderCancellationModule } from "../slices/order-cancellation/presentation/order-cancellation.module";
import type { CheckoutPaymentOrderRecord, CheckoutPaymentUserRecord } from "../slices/checkout-payment/domain/checkout-payment.types";
import type { DeliveryAssignmentPrismaProvider } from "../slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
import type { OrderCancellationPrismaProvider } from "../slices/order-cancellation/infrastructure/prisma-order-cancellation.repository";
import type { CheckoutPaymentRuntimeState } from "./checkout-payment-runtime";

type RuntimeOrderMetadata = {
  updatedAt: Date;
  cancelledByUserId: string | null;
  cancellationReasonCode: string | null;
  cancelledAt: Date | null;
};

type OperationalRuntimeState = {
  orderMetadata: Map<string, RuntimeOrderMetadata>;
  nextStatusHistoryId: bigint;
  nextAssignmentAuditId: bigint;
  nextCancellationAuditId: bigint;
  nextEventId: bigint;
};

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
    updatedAt: nowFactory(),
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

  const deliveryAssignmentClient: DeliveryAssignmentPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) => toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory),
      update: async ({ where, data }) => {
        const resolved = findOrder(state, runtimeState, where.id, nowFactory);

        if (resolved === null) {
          throw new Error(`Unknown order ${where.id}`);
        }

        resolved.order.courierId = data.courierId;
        resolved.order.status = data.status;
        resolved.metadata.updatedAt = nowFactory();

        return toAssignmentOrderRecord(state, runtimeState, where.id, nowFactory)!;
      },
    },
    user: {
      findUnique: async ({ where }) => {
        const user = state.users.find((candidate) => candidate.id === where.id);

        return user === undefined
          ? null
          : {
              id: user.id,
              telegramId: user.telegramId,
              role: user.role,
              isActive: user.isActive,
              name: user.name,
            };
      },
    },
    orderStatusHistory: {
      create: async ({ data }) => ({
        id: runtimeState.nextStatusHistoryId++,
        ...data,
      }),
    },
    deliveryAssignmentAudit: {
      create: async ({ data }) => ({
        id: runtimeState.nextAssignmentAuditId++,
        ...data,
      }),
    },
    event: {
      create: async ({ data }) => ({
        id: runtimeState.nextEventId++,
        ...data,
        createdAt: nowFactory(),
      }),
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

        if (resolved === null || resolved.order.refundStatus !== where.refundStatus) {
          return { count: 0 };
        }

        resolved.order.refundStatus = data.refundStatus;
        resolved.order.refundNote = data.refundNote;
        resolved.metadata.updatedAt = nowFactory();
        return { count: 1 };
      },
    },
    orderStatusHistory: {
      create: async ({ data }) => ({
        id: runtimeState.nextStatusHistoryId++,
        ...data,
      }),
    },
    orderCancellationAudit: {
      create: async ({ data }) => ({
        id: runtimeState.nextCancellationAuditId++,
        ...data,
      }),
    },
    event: {
      create: async ({ data }) => ({
        id: runtimeState.nextEventId++,
        ...data,
        createdAt: nowFactory(),
      }),
    },
    $transaction: async (callback) => callback(orderCancellationClient),
  };

  return {
    deliveryAssignmentModule: createDeliveryAssignmentModule({
      client: deliveryAssignmentClient,
    }),
    orderCancellationModule: createOrderCancellationModule({
      client: orderCancellationClient,
    }),
  };
};
