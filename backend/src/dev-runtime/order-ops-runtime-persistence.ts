import { existsSync, mkdirSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import type { OperationalRuntimeState } from "./order-ops-runtime";
import { cloneOperationalRuntimeStateForPersistence } from "./order-ops-runtime";

type SerializedOperationalRuntimeState = {
  orderMetadata?: Array<{
    orderId: string;
    createdAt: string;
    updatedAt: string;
    assignedAt: string | null;
    cancelledByUserId: string | null;
    cancellationReasonCode: string | null;
    cancelledAt: string | null;
  }>;
  courierAvailability?: Array<{
    userId: string;
    acceptingOrdersUntil: string | null;
    autoOfferEnabled: boolean;
    ratingScore: number;
  }>;
  assignmentOffers?: Array<{
    id: string;
    orderId: string;
    targetCourierId: string | null;
    kind: "MANUAL" | "BROADCAST";
    status: "PENDING" | "CLAIMED" | "EXPIRED" | "CANCELLED";
    createdAt: string;
    updatedAt: string;
  }>;
  statusHistory?: Array<{
    id: string;
    orderId: string;
    oldStatus: string;
    newStatus: string;
    changedByUserId: string;
    changedByRole?: string;
    changedByName?: string;
    changedAt: string;
  }>;
  events?: Array<{
    id: string;
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
    createdAt: string;
  }>;
  courierStaffLifecycleEvents?: Array<{
    id: string;
    courierUserId: string;
    actorAdminAccountId: string;
    action: "CREATED" | "DEACTIVATED" | "REACTIVATED" | "NICKNAME_UPDATED";
    previousNickname: string | null;
    newNickname: string | null;
    reason: string | null;
    createdAt: string;
  }>;
  courierStaffRatingAdjustments?: Array<{
    id: string;
    courierUserId: string;
    actorAdminAccountId: string;
    delta: -1 | 1;
    reason: string | null;
    createdAt: string;
  }>;
  nextAssignmentOfferId?: string;
  nextStatusHistoryId?: string;
  nextAssignmentAuditId?: string;
  nextCancellationAuditId?: string;
  nextEventId?: string;
  nextCourierStaffLifecycleEventId?: string;
  nextCourierStaffRatingAdjustmentId?: string;
};

export type OperationalRuntimeStatePersistence = {
  databasePath: string;
  loadState: () => OperationalRuntimeState | null;
  saveState: (state: OperationalRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

const dateToJson = (value: Date | null): string | null => (value === null ? null : value.toISOString());
const dateFromJson = (value: string | null | undefined): Date | null =>
  value === null || value === undefined ? null : new Date(value);

const serializeOperationalRuntimeState = (
  state: OperationalRuntimeState,
): SerializedOperationalRuntimeState => {
  const cloned = cloneOperationalRuntimeStateForPersistence(state);

  return {
    orderMetadata: [...cloned.orderMetadata.entries()].map(([orderId, metadata]) => ({
      orderId,
      createdAt: metadata.createdAt.toISOString(),
      updatedAt: metadata.updatedAt.toISOString(),
      assignedAt: dateToJson(metadata.assignedAt),
      cancelledByUserId: metadata.cancelledByUserId,
      cancellationReasonCode: metadata.cancellationReasonCode,
      cancelledAt: dateToJson(metadata.cancelledAt),
    })),
    courierAvailability: [...cloned.courierAvailability.entries()].map(([userId, availability]) => ({
      userId,
      acceptingOrdersUntil: dateToJson(availability.acceptingOrdersUntil),
      autoOfferEnabled: availability.autoOfferEnabled,
      ratingScore: availability.ratingScore,
    })),
    assignmentOffers: cloned.assignmentOffers.map((offer) => ({
      ...offer,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    })),
    statusHistory: cloned.statusHistory.map((history) => ({
      ...history,
      id: history.id.toString(),
      changedAt: history.changedAt.toISOString(),
    })),
    events: cloned.events.map((event) => ({
      ...event,
      id: event.id.toString(),
      payload: { ...event.payload },
      createdAt: event.createdAt.toISOString(),
    })),
    courierStaffLifecycleEvents: cloned.courierStaffLifecycleEvents.map((event) => ({
      ...event,
      id: event.id.toString(),
      createdAt: event.createdAt.toISOString(),
    })),
    courierStaffRatingAdjustments: cloned.courierStaffRatingAdjustments.map((adjustment) => ({
      ...adjustment,
      id: adjustment.id.toString(),
      createdAt: adjustment.createdAt.toISOString(),
    })),
    nextAssignmentOfferId: cloned.nextAssignmentOfferId.toString(),
    nextStatusHistoryId: cloned.nextStatusHistoryId.toString(),
    nextAssignmentAuditId: cloned.nextAssignmentAuditId.toString(),
    nextCancellationAuditId: cloned.nextCancellationAuditId.toString(),
    nextEventId: cloned.nextEventId.toString(),
    nextCourierStaffLifecycleEventId: cloned.nextCourierStaffLifecycleEventId.toString(),
    nextCourierStaffRatingAdjustmentId: cloned.nextCourierStaffRatingAdjustmentId.toString(),
  };
};

const deserializeOperationalRuntimeState = (
  state: SerializedOperationalRuntimeState,
): OperationalRuntimeState => ({
  orderMetadata: new Map(
    (state.orderMetadata ?? []).map((metadata) => [
      metadata.orderId,
      {
        createdAt: new Date(metadata.createdAt),
        updatedAt: new Date(metadata.updatedAt),
        assignedAt: dateFromJson(metadata.assignedAt),
        cancelledByUserId: metadata.cancelledByUserId,
        cancellationReasonCode: metadata.cancellationReasonCode,
        cancelledAt: dateFromJson(metadata.cancelledAt),
      },
    ]),
  ),
  courierAvailability: new Map(
    (state.courierAvailability ?? []).map((availability) => [
      availability.userId,
      {
        acceptingOrdersUntil: dateFromJson(availability.acceptingOrdersUntil),
        autoOfferEnabled: availability.autoOfferEnabled,
        ratingScore: availability.ratingScore,
      },
    ]),
  ),
  assignmentOffers: (state.assignmentOffers ?? []).map((offer) => ({
    ...offer,
    createdAt: new Date(offer.createdAt),
    updatedAt: new Date(offer.updatedAt),
  })),
  statusHistory: (state.statusHistory ?? []).map((history) => ({
    ...history,
    id: BigInt(history.id),
    changedAt: new Date(history.changedAt),
  })),
  events: (state.events ?? []).map((event) => ({
    ...event,
    id: BigInt(event.id),
    payload: { ...event.payload },
    createdAt: new Date(event.createdAt),
  })),
  courierStaffLifecycleEvents: (state.courierStaffLifecycleEvents ?? []).map((event) => ({
    ...event,
    id: BigInt(event.id),
    createdAt: new Date(event.createdAt),
  })),
  courierStaffRatingAdjustments: (state.courierStaffRatingAdjustments ?? []).map((adjustment) => ({
    ...adjustment,
    id: BigInt(adjustment.id),
    createdAt: new Date(adjustment.createdAt),
  })),
  nextAssignmentOfferId: BigInt(state.nextAssignmentOfferId ?? "1"),
  nextStatusHistoryId: BigInt(state.nextStatusHistoryId ?? "1"),
  nextAssignmentAuditId: BigInt(state.nextAssignmentAuditId ?? "1"),
  nextCancellationAuditId: BigInt(state.nextCancellationAuditId ?? "1"),
  nextEventId: BigInt(state.nextEventId ?? "1"),
  nextCourierStaffLifecycleEventId: BigInt(state.nextCourierStaffLifecycleEventId ?? "1"),
  nextCourierStaffRatingAdjustmentId: BigInt(state.nextCourierStaffRatingAdjustmentId ?? "1"),
});

export const createOperationalRuntimeStatePersistence = (
  databasePath: string,
  cleanupDirectory: string | null = null,
): OperationalRuntimeStatePersistence => {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS operational_runtime_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const saveState = (state: OperationalRuntimeState): void => {
    database
      .prepare(
        `INSERT INTO operational_runtime_state (id, payload, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(JSON.stringify(serializeOperationalRuntimeState(state)), new Date().toISOString());
  };

  const loadState = (): OperationalRuntimeState | null => {
    const row = database
      .prepare("SELECT payload FROM operational_runtime_state WHERE id = 1")
      .get() as { payload: string } | undefined;

    return row === undefined
      ? null
      : deserializeOperationalRuntimeState(JSON.parse(row.payload) as SerializedOperationalRuntimeState);
  };

  return {
    databasePath,
    loadState,
    saveState,
    close: () => {
      database.close();
    },
    cleanup: () => {
      if (cleanupDirectory !== null && existsSync(cleanupDirectory)) {
        rmSync(cleanupDirectory, { recursive: true, force: true });
      }
    },
  };
};
