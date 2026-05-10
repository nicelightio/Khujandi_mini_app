export type DeliveryAssignmentOrderId = string;
export type DeliveryAssignmentUserId = string;
export type DeliveryAssignmentRevision = string;

export type DeliveryAssignmentUserRole =
  | "boss"
  | "manager"
  | "operator"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type DeliveryAssignmentOrderStatus =
  | "CREATED"
  | "DELAYED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type DeliveryAssignmentOfferKind = "manual" | "broadcast";

export type DeliveryAssignmentOfferStatus =
  | "pending"
  | "claimed"
  | "expired"
  | "cancelled";

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
  acceptingOrdersUntil: Date | null;
  autoOfferEnabled: boolean;
  ratingScore: number;
  name: string;
};

export type DeliveryAssignmentCourierAvailabilityRecord = {
  courierId: DeliveryAssignmentUserId;
  active: boolean;
  free: boolean;
  autoOfferEnabled: boolean;
  acceptingOrdersUntil: Date | null;
  ratingScore: number;
};

export type DeliveryAssignmentOfferRecord = {
  id: string;
  orderId: DeliveryAssignmentOrderId;
  targetCourierId: DeliveryAssignmentUserId | null;
  kind: DeliveryAssignmentOfferKind;
  status: DeliveryAssignmentOfferStatus;
  createdAt: Date;
  updatedAt: Date;
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
  action: "assigned" | "override_assigned";
  createdAt: Date;
};

export type DeliveryAssignmentAuditRecord = CreateDeliveryAssignmentAuditInput & {
  id: bigint;
};

export type CreateDeliveryAssignmentEventInput = {
  type:
    | "order.assigned"
    | "order.offer_created"
    | "order.offer_repeated"
    | "order.assignment_timeout"
    | "order.delayed";
  entity: "order";
  entityId: DeliveryAssignmentOrderId;
  payload:
    | {
        orderId: DeliveryAssignmentOrderId;
        courierId: DeliveryAssignmentUserId;
        assignedByUserId: DeliveryAssignmentUserId;
        status: "ASSIGNED";
        updatedAt: string;
      }
    | {
        orderId: DeliveryAssignmentOrderId;
        offerId: string;
        targetCourierId: DeliveryAssignmentUserId;
        createdByUserId: DeliveryAssignmentUserId;
        kind: DeliveryAssignmentOfferKind;
        status: "pending";
        orderStatus: "CREATED" | "DELAYED";
        updatedAt: string;
      }
    | {
        orderId: DeliveryAssignmentOrderId;
        offerId: string;
        targetCourierId: DeliveryAssignmentUserId | null;
        kind: DeliveryAssignmentOfferKind;
        status: "pending";
        orderStatus: "CREATED" | "DELAYED";
        updatedAt: string;
      }
    | {
        orderId: DeliveryAssignmentOrderId;
        offerId: string;
        targetCourierId: DeliveryAssignmentUserId | null;
        kind: DeliveryAssignmentOfferKind;
        status: "expired";
        orderStatus: "CREATED" | "DELAYED";
        updatedAt: string;
      }
    | {
        orderId: DeliveryAssignmentOrderId;
        oldStatus: "CREATED";
        newStatus: "DELAYED";
        reason: "assignment_timeout";
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

export type AssignDeliveryOrderOverrideInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  actor: DeliveryAssignmentActor | null;
  override: {
    confirmed: true;
  } | null;
};

export type ClaimDeliveryAssignmentOfferInput = {
  offerId: string;
  courierId: DeliveryAssignmentUserId;
};

export type CreateManualDeliveryAssignmentOfferInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  actor: DeliveryAssignmentActor | null;
};

export type CreateBroadcastDeliveryAssignmentOfferInput = {
  orderId: DeliveryAssignmentOrderId;
  actor: DeliveryAssignmentActor | null;
};

export type PersistDeliveryAssignmentInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  adminUserId: DeliveryAssignmentUserId;
  assignedAt: Date;
  auditAction: "assigned" | "override_assigned";
};

export type PersistManualDeliveryAssignmentOfferInput = {
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  actorUserId: DeliveryAssignmentUserId;
  orderStatus: "CREATED" | "DELAYED";
  createdAt: Date;
};

export type PersistBroadcastDeliveryAssignmentOffersInput = {
  orderId: DeliveryAssignmentOrderId;
  courierIds: DeliveryAssignmentUserId[];
  actorUserId: DeliveryAssignmentUserId;
  orderStatus: "CREATED" | "DELAYED";
  createdAt: Date;
};

export type PersistClaimDeliveryAssignmentOfferInput = {
  offerId: string;
  orderId: DeliveryAssignmentOrderId;
  courierId: DeliveryAssignmentUserId;
  oldStatus: "CREATED" | "DELAYED";
  claimedAt: Date;
};

export type EvaluateDeliveryAssignmentOfferTimeoutsInput = {
  now: Date;
  repeatAfterMs: number;
  expireAfterMs: number;
};

export type DeliveryAssignmentOfferRepeatRecord = {
  offer: DeliveryAssignmentOfferRecord;
  order: DeliveryAssignmentOrderRecord & { status: "CREATED" | "DELAYED"; courierId: null };
  courier: DeliveryAssignmentCourierRecord | null;
  event: DeliveryAssignmentEventRecord;
};

export type DeliveryAssignmentOfferTimeoutRecord = {
  offer: DeliveryAssignmentOfferRecord & { status: "expired" };
  order: DeliveryAssignmentOrderRecord & { status: "CREATED" | "DELAYED"; courierId: null };
  timeoutEvent: DeliveryAssignmentEventRecord;
  delayedEvent: DeliveryAssignmentEventRecord | null;
  statusHistory: DeliveryAssignmentStatusHistoryRecord | null;
  penalizedCourierId: DeliveryAssignmentUserId | null;
};

export type DeliveryAssignmentOperatorNotificationTarget = {
  userId: DeliveryAssignmentUserId;
  telegramId: string;
  name: string;
  role: Extract<DeliveryAssignmentUserRole, "boss" | "manager" | "operator" | "admin">;
};

export type DeliveryAssignmentOfferTimeoutEvaluationArtifacts = {
  repeated: DeliveryAssignmentOfferRepeatRecord[];
  timedOut: DeliveryAssignmentOfferTimeoutRecord[];
  operatorTargets: DeliveryAssignmentOperatorNotificationTarget[];
  revision: DeliveryAssignmentRevision;
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

export type DeliveryAssignmentOfferCommandResult = {
  orderId: DeliveryAssignmentOrderId;
  offerId: string;
  targetCourierId: DeliveryAssignmentUserId;
  kind: DeliveryAssignmentOfferKind;
  status: "pending";
  orderStatus: "CREATED" | "DELAYED";
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export type DeliveryAssignmentBroadcastOfferCommandResult = {
  orderId: DeliveryAssignmentOrderId;
  kind: "broadcast";
  status: "pending";
  orderStatus: "CREATED" | "DELAYED";
  eligibleCourierCount: number;
  offers: DeliveryAssignmentOfferCommandResult[];
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export type DeliveryAssignmentOfferTimeoutEvaluationResult = {
  evaluatedAt: Date;
  repeatedOfferCount: number;
  expiredOfferCount: number;
  delayedOrderCount: number;
  penalizedCourierCount: number;
  operatorNotificationCount: number;
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

export type DeliveryAssignmentOfferNotificationInput = {
  orderId: DeliveryAssignmentOrderId;
  offerId: string;
  targetCourierId: DeliveryAssignmentUserId;
  courierTelegramId: string;
  courierName: string;
  createdByUserId: DeliveryAssignmentUserId;
  kind: DeliveryAssignmentOfferKind;
  orderStatus: "CREATED" | "DELAYED";
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export type DeliveryAssignmentOfferRepeatNotificationInput =
  DeliveryAssignmentOfferNotificationInput;

export type DeliveryAssignmentOperatorDelayedNotificationInput = {
  orderId: DeliveryAssignmentOrderId;
  operatorTelegramIds: string[];
  expiredOfferCount: number;
  updatedAt: Date;
  revision: DeliveryAssignmentRevision;
};

export interface DeliveryAssignmentNotifier {
  notifyCourierAssigned(input: DeliveryAssignmentNotificationInput): Promise<void>;
  notifyCourierOfferCreated?(input: DeliveryAssignmentOfferNotificationInput): Promise<void>;
  notifyCourierOfferRepeated?(input: DeliveryAssignmentOfferRepeatNotificationInput): Promise<void>;
  notifyOperatorsAssignmentDelayed?(input: DeliveryAssignmentOperatorDelayedNotificationInput): Promise<void>;
}

export interface DeliveryAssignmentRepository {
  findOrderById(orderId: DeliveryAssignmentOrderId): Promise<DeliveryAssignmentOrderRecord | null>;
  findCourierById(courierId: DeliveryAssignmentUserId): Promise<DeliveryAssignmentCourierRecord | null>;
  findAutoOfferCandidateCouriers?(
    now: Date,
  ): Promise<DeliveryAssignmentCourierRecord[]>;
  findOperatorNotificationTargets?(): Promise<DeliveryAssignmentOperatorNotificationTarget[]>;
  startCourierWork(courierId: DeliveryAssignmentUserId): Promise<DeliveryAssignmentCourierRecord | null>;
  stopCourierWorkAfter(
    courierId: DeliveryAssignmentUserId,
    acceptingOrdersUntil: Date,
  ): Promise<DeliveryAssignmentCourierRecord | null>;
  setCourierAutoOfferParticipation(
    courierId: DeliveryAssignmentUserId,
    enabled: boolean,
  ): Promise<DeliveryAssignmentCourierRecord | null>;
  hasBusyCourierOrder(courierId: DeliveryAssignmentUserId): Promise<boolean>;
  findOfferById?(
    offerId: string,
  ): Promise<DeliveryAssignmentOfferRecord | null>;
  findOffersForOrder?(
    orderId: DeliveryAssignmentOrderId,
  ): Promise<DeliveryAssignmentOfferRecord[]>;
  createManualOffer(
    input: PersistManualDeliveryAssignmentOfferInput,
  ): Promise<{
    offer: DeliveryAssignmentOfferRecord;
    event: DeliveryAssignmentEventRecord;
    order: DeliveryAssignmentOrderRecord;
    revision: DeliveryAssignmentRevision;
  }>;
  createBroadcastOffers(
    input: PersistBroadcastDeliveryAssignmentOffersInput,
  ): Promise<{
    offers: Array<{
      offer: DeliveryAssignmentOfferRecord;
      event: DeliveryAssignmentEventRecord;
    }>;
    order: DeliveryAssignmentOrderRecord;
    revision: DeliveryAssignmentRevision;
  }>;
  claimOffer(
    input: PersistClaimDeliveryAssignmentOfferInput,
  ): Promise<DeliveryAssignmentArtifactsRecord | null>;
  evaluateOfferTimeouts?(
    input: EvaluateDeliveryAssignmentOfferTimeoutsInput,
  ): Promise<DeliveryAssignmentOfferTimeoutEvaluationArtifacts>;
  assignCourier(
    input: PersistDeliveryAssignmentInput,
  ): Promise<DeliveryAssignmentArtifactsRecord | null>;
}
