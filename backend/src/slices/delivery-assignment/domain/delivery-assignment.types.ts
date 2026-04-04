export type DeliveryAssignmentOrderId = string;
export type DeliveryAssignmentUserId = string;
export type DeliveryAssignmentRevision = string;

export type DeliveryAssignmentUserRole =
  | "boss"
  | "manager"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type DeliveryAssignmentOrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type DeliveryAssignmentOrderRecord = {
  id: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId | null;
  status: DeliveryAssignmentOrderStatus;
  updatedAt: Date;
  isDeleted: boolean;
};

export type DeliveryAssignmentActor = {
  userId: DeliveryAssignmentUserId;
  role: DeliveryAssignmentUserRole;
};

export type DeliveryAssignmentCourierRecord = {
  id: DeliveryAssignmentUserId;
  telegramId: string;
  role: DeliveryAssignmentUserRole;
  isActive: boolean;
  name: string;
};

export type CreateDeliveryAssignmentStatusHistoryInput = {
  orderId: DeliveryAssignmentOrderId;
  oldStatus: DeliveryAssignmentOrderStatus;
  newStatus: DeliveryAssignmentOrderStatus;
  changedByUserId: DeliveryAssignmentUserId;
  changedAt: Date;
};

export type DeliveryAssignmentStatusHistoryRecord = CreateDeliveryAssignmentStatusHistoryInput & {
  id: bigint;
};

export type CreateDeliveryAssignmentAuditInput = {
  orderId: DeliveryAssignmentOrderId;
  adminUserId: DeliveryAssignmentUserId;
  courierUserId: DeliveryAssignmentUserId;
  action: "assigned";
  createdAt: Date;
};

export type DeliveryAssignmentAuditRecord = CreateDeliveryAssignmentAuditInput & {
  id: bigint;
};

export type CreateDeliveryAssignmentEventInput = {
  type: "order.assigned";
  entity: "order";
  entityId: DeliveryAssignmentOrderId;
  payload: {
    orderId: DeliveryAssignmentOrderId;
    courierId: DeliveryAssignmentUserId;
    assignedByUserId: DeliveryAssignmentUserId;
    status: "ASSIGNED";
    updatedAt: string;
  };
};

export type DeliveryAssignmentEventRecord = CreateDeliveryAssignmentEventInput & {
  id: bigint;
  createdAt: Date;
};

export type RecordDeliveryAssignmentArtifactsInput = {
  statusHistory: CreateDeliveryAssignmentStatusHistoryInput;
  audit: CreateDeliveryAssignmentAuditInput;
  event: CreateDeliveryAssignmentEventInput;
};

export type AssignDeliveryOrderInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  actor: DeliveryAssignmentActor | null;
};

export type PersistDeliveryAssignmentInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  adminUserId: DeliveryAssignmentUserId;
  assignedAt: Date;
};

export type DeliveryAssignmentArtifactsRecord = {
  order: DeliveryAssignmentOrderRecord;
  statusHistory: DeliveryAssignmentStatusHistoryRecord;
  audit: DeliveryAssignmentAuditRecord;
  event: DeliveryAssignmentEventRecord;
  revision: DeliveryAssignmentRevision;
};

export type DeliveryAssignmentCommandResult = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  status: "ASSIGNED";
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export type DeliveryAssignmentNotificationInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  courierTelegramId: string;
  courierName: string;
  assignedByUserId: DeliveryAssignmentUserId;
  status: "ASSIGNED";
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export interface DeliveryAssignmentNotifier {
  notifyCourierAssigned(input: DeliveryAssignmentNotificationInput): Promise<void>;
}

export interface DeliveryAssignmentRepository {
  findOrderById(orderId: DeliveryAssignmentOrderId): Promise<DeliveryAssignmentOrderRecord | null>;
  findCourierById(courierId: DeliveryAssignmentUserId): Promise<DeliveryAssignmentCourierRecord | null>;
  assignCourier(
    input: PersistDeliveryAssignmentInput,
  ): Promise<DeliveryAssignmentArtifactsRecord>;
}
