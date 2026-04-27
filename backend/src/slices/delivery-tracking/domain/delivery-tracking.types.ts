export type DeliveryTrackingOrderId = string;
export type DeliveryTrackingUserId = string;
export type DeliveryTrackingRevision = string;
export type DeliveryTrackingCursor = string;
export type DeliveryTrackingActionStatus = "IN_PROGRESS" | "DELIVERED" | "COMPLETED";
export type DeliveryTrackingUserRole =
  | "boss"
  | "manager"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type DeliveryTrackingOrderStatus =
  | "CREATED"
  | "ASSIGNED"
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
  changedAt: Date;
};

export type DeliveryTrackingStatusHistoryRecord = CreateDeliveryTrackingStatusHistoryInput & {
  id: bigint;
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
    updatedAt: string;
  };
};

export type DeliveryTrackingEventRecord = {
  type: "order.assigned" | "order.status_changed";
  entity: "order";
  entityId: DeliveryTrackingOrderId;
  payload: {
    orderId: DeliveryTrackingOrderId;
    previousStatus?: DeliveryTrackingOrderStatus;
    status: DeliveryTrackingOrderStatus;
    changedByUserId?: DeliveryTrackingUserId;
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
