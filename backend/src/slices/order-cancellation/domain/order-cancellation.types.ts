export type OrderCancellationOrderId = string;
export type OrderCancellationUserId = string;
export type OrderCancellationRevision = string;
export type OrderCancellationUserRole =
  | "boss"
  | "manager"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type OrderCancellationOrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type OrderCancellationPaymentStatus = "PAID" | "FAILED" | "CANCELED" | "PENDING";

export type OrderCancellationRefundStatus =
  | "NOT_REQUIRED"
  | "PENDING_MANUAL"
  | "DONE"
  | "REJECTED";

export type OrderCancellationOrderRecord = {
  id: OrderCancellationOrderId;
  courierId: OrderCancellationUserId | null;
  status: OrderCancellationOrderStatus;
  paymentStatus: OrderCancellationPaymentStatus;
  refundStatus: OrderCancellationRefundStatus;
  refundNote: string | null;
  cancelledByUserId: OrderCancellationUserId | null;
  cancellationReasonCode: string | null;
  cancelledAt: Date | null;
  updatedAt: Date;
  isDeleted: boolean;
};

export type OrderCancellationActor = {
  userId: OrderCancellationUserId;
  role: OrderCancellationUserRole;
};

export type AuthorizedOrderCancellationInput = {
  orderId: OrderCancellationOrderId;
  actor: OrderCancellationActor | null;
  reasonCode: string;
};

export type AuthorizedOrderRefundUpdateInput = {
  orderId: OrderCancellationOrderId;
  actor: OrderCancellationActor | null;
  refundStatus: Extract<OrderCancellationRefundStatus, "DONE" | "REJECTED">;
  refundNote: string;
};

export type CreateOrderCancellationStatusHistoryInput = {
  orderId: OrderCancellationOrderId;
  oldStatus: OrderCancellationOrderStatus;
  newStatus: OrderCancellationOrderStatus;
  changedByUserId: OrderCancellationUserId;
  changedAt: Date;
};

export type OrderCancellationStatusHistoryRecord = CreateOrderCancellationStatusHistoryInput & {
  id: bigint;
};

export type CreateOrderCancellationAuditInput = {
  orderId: OrderCancellationOrderId;
  actorUserId: OrderCancellationUserId;
  actorRole: Uppercase<OrderCancellationUserRole>;
  action: "cancelled" | "refund_updated";
  reasonCode: string | null;
  refundStatus: OrderCancellationRefundStatus;
  refundNote: string | null;
  fromStatus: OrderCancellationOrderStatus | null;
  toStatus: OrderCancellationOrderStatus | null;
  createdAt: Date;
};

export type OrderCancellationAuditRecord = CreateOrderCancellationAuditInput & {
  id: bigint;
};

export type CreateOrderCancelledEventInput = {
  type: "order.cancelled";
  entity: "order";
  entityId: OrderCancellationOrderId;
  payload: {
    orderId: OrderCancellationOrderId;
    previousStatus: OrderCancellationOrderStatus;
    status: Extract<
      OrderCancellationOrderStatus,
      "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE"
    >;
    cancelledByUserId: OrderCancellationUserId;
    actorRole: OrderCancellationUserRole;
    reasonCode: string;
    refundStatus: OrderCancellationRefundStatus;
    updatedAt: string;
  };
};

export type CreateOrderRefundUpdatedEventInput = {
  type: "order.refund_updated";
  entity: "order";
  entityId: OrderCancellationOrderId;
  payload: {
    orderId: OrderCancellationOrderId;
    status: Extract<
      OrderCancellationOrderStatus,
      "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE"
    >;
    refundStatus: OrderCancellationRefundStatus;
    refundNote: string | null;
    updatedByUserId: OrderCancellationUserId;
    updatedAt: string;
  };
};

export type OrderCancellationEventRecord =
  | (CreateOrderCancelledEventInput & { id: bigint; createdAt: Date })
  | (CreateOrderRefundUpdatedEventInput & { id: bigint; createdAt: Date });

export type PersistOrderCancellationInput = {
  orderId: OrderCancellationOrderId;
  actor: OrderCancellationActor;
  oldStatus: OrderCancellationOrderStatus;
  newStatus: Extract<
    OrderCancellationOrderStatus,
    "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE"
  >;
  reasonCode: string;
  refundStatus: OrderCancellationRefundStatus;
  refundNote: string | null;
  cancelledAt: Date;
};

export type OrderCancellationArtifactsRecord = {
  order: OrderCancellationOrderRecord;
  statusHistory: OrderCancellationStatusHistoryRecord;
  audit: OrderCancellationAuditRecord;
  event: OrderCancellationEventRecord;
  revision: OrderCancellationRevision;
};

export type PersistOrderRefundUpdateInput = {
  orderId: OrderCancellationOrderId;
  actor: OrderCancellationActor;
  refundStatus: Exclude<OrderCancellationRefundStatus, "PENDING_MANUAL">;
  refundNote: string | null;
  updatedAt: Date;
};

export type OrderRefundUpdateArtifactsRecord = {
  order: OrderCancellationOrderRecord;
  audit: OrderCancellationAuditRecord;
  event: OrderCancellationEventRecord;
  revision: OrderCancellationRevision;
};

export type OrderCancellationCommandResult = {
  orderId: OrderCancellationOrderId;
  status: Extract<
    OrderCancellationOrderStatus,
    "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE"
  >;
  refundStatus: OrderCancellationRefundStatus;
  updatedAt: Date;
  revision: OrderCancellationRevision;
};

export type OrderRefundUpdateResult = {
  orderId: OrderCancellationOrderId;
  status: Extract<
    OrderCancellationOrderStatus,
    "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE"
  >;
  refundStatus: Exclude<OrderCancellationRefundStatus, "PENDING_MANUAL">;
  refundNote: string | null;
  updatedAt: Date;
  revision: OrderCancellationRevision;
};

export interface OrderCancellationRepository {
  findOrderById(orderId: OrderCancellationOrderId): Promise<OrderCancellationOrderRecord | null>;
  recordCancellation(input: PersistOrderCancellationInput): Promise<OrderCancellationArtifactsRecord>;
  recordRefundUpdate(input: PersistOrderRefundUpdateInput): Promise<OrderRefundUpdateArtifactsRecord>;
}
