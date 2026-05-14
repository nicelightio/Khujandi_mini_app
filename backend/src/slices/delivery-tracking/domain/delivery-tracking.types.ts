export type DeliveryTrackingOrderId = string;
export type DeliveryTrackingUserId = string;
export type DeliveryTrackingRevision = string;
export type DeliveryTrackingCursor = string;
export type DeliveryTrackingActionStatus = "PICKED_UP" | "IN_PROGRESS" | "DELIVERED";
export type DeliveryTrackingUserRole =
  | "boss"
  | "operator"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type DeliveryTrackingOrderStatus =
  | "CREATED"
  | "DELAYED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type DeliveryTrackingOrderRecord = {
  id: DeliveryTrackingOrderId;
  courierId: DeliveryTrackingUserId | null;
  status: DeliveryTrackingOrderStatus;
  updatedAt: Date;
  isDeleted: boolean;
};

export type DeliveryTrackingStatusActor = {
  userId: DeliveryTrackingUserId;
  role: DeliveryTrackingUserRole;
  name?: string;
};

export type DeliveryTrackingStatusCommandInput = {
  orderId: DeliveryTrackingOrderId;
  nextStatus: DeliveryTrackingOrderStatus;
  actor: DeliveryTrackingStatusActor | null;
};

export type CreateDeliveryTrackingStatusHistoryInput = {
  orderId: DeliveryTrackingOrderId;
  oldStatus: DeliveryTrackingOrderStatus;
  newStatus: DeliveryTrackingOrderStatus;
  changedByUserId: DeliveryTrackingUserId;
  changedByRole?: DeliveryTrackingUserRole;
  changedByName?: string;
  changedAt: Date;
};

export type DeliveryTrackingStatusHistoryRecord = Omit<
  CreateDeliveryTrackingStatusHistoryInput,
  "changedByRole" | "changedByName"
> & {
  id: bigint;
  changedByRole?: DeliveryTrackingUserRole | null;
  changedByName?: string | null;
};

export type CreateDeliveryTrackingEventInput = {
  type: "order.status_changed";
  entity: "order";
  entityId: DeliveryTrackingOrderId;
  payload: {
    orderId: DeliveryTrackingOrderId;
    previousStatus: DeliveryTrackingOrderStatus;
    status: DeliveryTrackingOrderStatus;
    changedByUserId: DeliveryTrackingUserId;
    changedByRole?: DeliveryTrackingUserRole;
    changedByName?: string;
    updatedAt: string;
  };
};

export type DeliveryTrackingEventRecord = {
  type: "order.assigned" | "order.status_changed" | "order.delayed";
  entity: "order";
  entityId: DeliveryTrackingOrderId;
  payload: {
    orderId: DeliveryTrackingOrderId;
    previousStatus?: DeliveryTrackingOrderStatus;
    status: DeliveryTrackingOrderStatus;
    changedByUserId?: DeliveryTrackingUserId;
    changedByRole?: DeliveryTrackingUserRole;
    changedByName?: string;
    courierId?: DeliveryTrackingUserId;
    assignedByUserId?: DeliveryTrackingUserId;
    updatedAt: string;
  };
  revision: DeliveryTrackingRevision;
  createdAt: string;
};

export type PersistDeliveryTrackingTransitionInput = {
  orderId: DeliveryTrackingOrderId;
  changedByUserId: DeliveryTrackingUserId;
  changedByRole?: DeliveryTrackingUserRole;
  changedByName?: string;
  oldStatus: DeliveryTrackingOrderStatus;
  newStatus: DeliveryTrackingOrderStatus;
  changedAt: Date;
};

export type DeliveryTrackingTransitionArtifacts = {
  order: DeliveryTrackingOrderRecord;
  statusHistory: DeliveryTrackingStatusHistoryRecord;
  event: DeliveryTrackingEventRecord;
  revision: DeliveryTrackingRevision;
};

export type DeliveryTrackingCommandResult = {
  orderId: DeliveryTrackingOrderId;
  status: DeliveryTrackingOrderStatus;
  updatedAt: Date;
  revision: DeliveryTrackingRevision;
};

export type DeliveryTrackingOperatorProcessedOrderMetric = {
  operatorAdminAccountId: DeliveryTrackingUserId;
  processedOrdersCount: number;
};

export type DeliveryTrackingOperatorStaffOrderHistoryProblemReason =
  | "future_failed"
  | "not_personally_completed";

export type DeliveryTrackingOperatorStaffOrderHistoryItem = {
  orderId: DeliveryTrackingOrderId;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastWriteAt: Date;
  actionTypes: string[];
  personallyCompleted: boolean;
  problemReasons: DeliveryTrackingOperatorStaffOrderHistoryProblemReason[];
};

export type DeliveryTrackingOperatorStaffOrderHistory = {
  operatorAdminAccountId: DeliveryTrackingUserId;
  lastProcessedOrders: DeliveryTrackingOperatorStaffOrderHistoryItem[];
  problemOrders: DeliveryTrackingOperatorStaffOrderHistoryItem[];
};

export type DeliveryTrackingNotificationInput = {
  orderId: DeliveryTrackingOrderId;
  courierTelegramId: string;
  status: DeliveryTrackingActionStatus;
  revision: DeliveryTrackingRevision;
  availableActions: DeliveryTrackingActionStatus[];
};

export type DeliveryTrackingEventStream = {
  events: DeliveryTrackingEventRecord[];
  nextCursor: DeliveryTrackingCursor;
};

export interface DeliveryTrackingNotifier {
  notifyStatusChanged(input: DeliveryTrackingNotificationInput): Promise<void>;
}

export interface DeliveryTrackingRepository {
  findOrderById(orderId: DeliveryTrackingOrderId): Promise<DeliveryTrackingOrderRecord | null>;
  findUserTelegramIdById(userId: DeliveryTrackingUserId): Promise<string | null>;
  recordStatusTransition(
    input: PersistDeliveryTrackingTransitionInput,
  ): Promise<DeliveryTrackingTransitionArtifacts>;
  listEventsSince(cursor?: DeliveryTrackingCursor): Promise<DeliveryTrackingEventStream>;
}
