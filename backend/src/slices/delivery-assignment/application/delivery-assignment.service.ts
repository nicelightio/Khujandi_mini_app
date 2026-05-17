import type {
  AdjustDeliveryAssignmentCourierStaffRatingCommandInput,
  AdjustDeliveryAssignmentCourierStaffRatingCommandResult,
  AssignDeliveryOrderOverrideInput,
  CreateDeliveryAssignmentCourierStaffCommandInput,
  CreateDeliveryAssignmentCourierStaffCommandResult,
  CreateBroadcastDeliveryAssignmentOfferInput,
  ClaimDeliveryAssignmentOfferInput,
  DeactivateDeliveryAssignmentCourierStaffCommandInput,
  DeactivateDeliveryAssignmentCourierStaffCommandResult,
  CreateManualDeliveryAssignmentOfferInput,
  DeliveryAssignmentBroadcastOfferCommandResult,
  DeliveryAssignmentCommandResult,
  DeliveryAssignmentCourierAvailabilityRecord,
  DeliveryAssignmentCourierRecord,
  DeliveryAssignmentCourierStaffIdentityRecord,
  DeliveryAssignmentCourierStaffRecord,
  DeliveryAssignmentCourierStaffRepository,
  DeliveryAssignmentOfferRepeatRecord,
  DeliveryAssignmentOfferTimeoutEvaluationResult,
  DeliveryAssignmentOfferTimeoutRecord,
  DeliveryAssignmentOfferCommandResult,
  DeliveryAssignmentNotifier,
  DeliveryAssignmentOrderId,
  DeliveryAssignmentOrderRecord,
  DeliveryAssignmentRepository,
  DeliveryAssignmentStaffPanelActor,
  DeliveryAssignmentUserId,
  ReactivateDeliveryAssignmentCourierStaffCommandInput,
  ReactivateDeliveryAssignmentCourierStaffCommandResult,
} from "../domain/delivery-assignment.types";
import { AppError } from "../../../shared/errors/app-error";

const ALLOWED_ASSIGNMENT_OVERRIDE_ROLES = new Set(["boss", "admin", "operator"]);
const ALLOWED_STAFF_PANEL_ROLES = new Set(["boss", "admin"]);
const ASSIGNABLE_ORDER_STATUS = "CREATED";
const CLAIMABLE_ORDER_STATUSES = new Set(["CREATED", "DELAYED"]);
const MANUAL_OFFER_ORDER_STATUSES = new Set(["CREATED", "DELAYED"]);
const ALLOWED_OFFER_ROLES = new Set(["boss", "admin", "operator"]);
const STOP_AFTER_MS = 5 * 60 * 1000;
const OFFER_REPEAT_AFTER_MS = 3 * 60 * 1000;
const OFFER_EXPIRE_AFTER_MS = 6 * 60 * 1000;
const NOOP_DELIVERY_ASSIGNMENT_NOTIFIER: DeliveryAssignmentNotifier = {
  async notifyCourierAssigned() {
    return undefined;
  },
};

export class DeliveryAssignmentService {
  private readonly courierStaffRepository: DeliveryAssignmentCourierStaffRepository;

  constructor(
    private readonly repository: DeliveryAssignmentRepository,
    private readonly notifier: DeliveryAssignmentNotifier = NOOP_DELIVERY_ASSIGNMENT_NOTIFIER,
    courierStaffRepository?: DeliveryAssignmentCourierStaffRepository,
  ) {
    this.courierStaffRepository =
      courierStaffRepository ?? (repository as unknown as DeliveryAssignmentCourierStaffRepository);
  }

  findOrderById(orderId: DeliveryAssignmentOrderId) {
    return this.repository.findOrderById(orderId);
  }

  findCourierById(courierId: DeliveryAssignmentUserId) {
    return this.repository.findCourierById(courierId);
  }

  findCourierStaffByTelegramUserId(telegramId: string) {
    return this.getCourierStaffRepository().findCourierStaffByTelegramUserId(telegramId.trim());
  }

  async createCourierStaff(
    input: CreateDeliveryAssignmentCourierStaffCommandInput,
  ): Promise<CreateDeliveryAssignmentCourierStaffCommandResult> {
    const now = input.now ?? new Date();
    const actor = this.assertStaffPanelActor(input.actor);
    const telegramId = normalizeRequiredValue(input.telegramUserId, "telegram_user_id");
    const nickname = normalizeRequiredValue(input.nickname, "courier nickname");
    const repository = this.getCourierStaffRepository();
    const existing = await repository.findCourierStaffByTelegramUserId(telegramId);

    if (existing !== null) {
      if (existing.role !== "courier") {
        throw new AppError(
          "TELEGRAM_USER_CONFLICT",
          "Telegram user id already belongs to a non-courier account",
          409,
          {
            telegram_user_id: telegramId,
            role: existing.role,
          },
        );
      }

      if (existing.lifecycle.staffDeactivatedAt !== null) {
        throw new AppError(
          "COURIER_STAFF_DEACTIVATED",
          "Courier staff is deactivated; use boss reactivation",
          409,
          {
            courierUserId: existing.id,
          },
        );
      }

      throw new AppError("DUPLICATE_COURIER_STAFF", "Courier staff already exists", 409, {
        telegram_user_id: telegramId,
        courierUserId: existing.id,
      });
    }

    const courier = await repository.createCourierStaff({
      telegramId,
      nickname,
      actorAdminAccountId: actor.adminAccountId,
      createdAt: now,
    });

    await repository.recordCourierStaffLifecycleEvent({
      courierUserId: courier.id,
      actorAdminAccountId: actor.adminAccountId,
      action: "created",
      previousNickname: null,
      newNickname: nickname,
      reason: null,
      createdAt: now,
    });

    return {
      courier,
    };
  }

  async deactivateCourierStaff(
    input: DeactivateDeliveryAssignmentCourierStaffCommandInput,
  ): Promise<DeactivateDeliveryAssignmentCourierStaffCommandResult> {
    const now = input.now ?? new Date();
    const actor = this.assertStaffPanelActor(input.actor);
    const repository = this.getCourierStaffRepository();
    const target = this.assertCourierStaffTarget(
      await repository.findCourierStaffById(input.courierUserId),
      input.courierUserId,
    );

    if (target.lifecycle.staffDeactivatedAt !== null) {
      throw new AppError("COURIER_STAFF_INACTIVE", "Courier staff is already deactivated", 409, {
        courierUserId: target.id,
      });
    }

    const courier = await repository.deactivateCourierStaff({
      courierUserId: target.id,
      actorAdminAccountId: actor.adminAccountId,
      deactivatedAt: now,
    });

    await repository.recordCourierStaffLifecycleEvent({
      courierUserId: target.id,
      actorAdminAccountId: actor.adminAccountId,
      action: "deactivated",
      previousNickname: target.nickname,
      newNickname: target.nickname,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      courier,
    };
  }

  async reactivateCourierStaff(
    input: ReactivateDeliveryAssignmentCourierStaffCommandInput,
  ): Promise<ReactivateDeliveryAssignmentCourierStaffCommandResult> {
    const now = input.now ?? new Date();
    const actor = this.assertBossStaffPanelActor(input.actor);
    const repository = this.getCourierStaffRepository();
    const target = this.assertCourierStaffTarget(
      await repository.findCourierStaffById(input.courierUserId),
      input.courierUserId,
    );

    if (target.lifecycle.staffDeactivatedAt === null) {
      throw new AppError("COURIER_STAFF_ACTIVE", "Courier staff is already active", 409, {
        courierUserId: target.id,
      });
    }

    const courier = await repository.reactivateCourierStaff({
      courierUserId: target.id,
      actorAdminAccountId: actor.adminAccountId,
      reactivatedAt: now,
    });

    await repository.recordCourierStaffLifecycleEvent({
      courierUserId: target.id,
      actorAdminAccountId: actor.adminAccountId,
      action: "reactivated",
      previousNickname: target.nickname,
      newNickname: target.nickname,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      courier,
    };
  }

  async adjustCourierStaffRating(
    input: AdjustDeliveryAssignmentCourierStaffRatingCommandInput,
  ): Promise<AdjustDeliveryAssignmentCourierStaffRatingCommandResult> {
    const now = input.now ?? new Date();
    const actor = this.assertStaffPanelActor(input.actor);
    const repository = this.getCourierStaffRepository();
    const target = this.assertCourierStaffTarget(
      await repository.findCourierStaffById(input.courierUserId),
      input.courierUserId,
    );

    if (target.lifecycle.staffDeactivatedAt !== null) {
      throw new AppError("COURIER_STAFF_INACTIVE", "Courier staff is deactivated", 409, {
        courierUserId: target.id,
      });
    }

    if (input.delta !== 1 && input.delta !== -1) {
      throw new AppError("VALIDATION_ERROR", "Courier staff rating adjustment must be +1 or -1", 400, {
        delta: input.delta,
      });
    }

    const adjustment = await repository.recordCourierStaffRatingAdjustment({
      courierUserId: target.id,
      actorAdminAccountId: actor.adminAccountId,
      delta: input.delta,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      adjustment,
    };
  }

  async startCourierWork(
    courierId: DeliveryAssignmentUserId,
    now = new Date(),
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord> {
    const existingCourier = await this.repository.findCourierById(courierId);
    this.assertCourierExists(existingCourier, courierId);
    this.assertCourierStaffOperational(existingCourier, courierId);

    const courier =
      existingCourier.isActive && existingCourier.acceptingOrdersUntil === null
        ? existingCourier
        : await this.repository.startCourierWork(courierId);
    this.assertCourierExists(courier, courierId);
    this.assertCourierStaffOperational(courier, courierId);

    return this.toAvailability(courier, await this.repository.hasBusyCourierOrder(courierId), now);
  }

  async stopCourierWorkAfter(
    courierId: DeliveryAssignmentUserId,
    now = new Date(),
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord> {
    const courier = await this.repository.findCourierById(courierId);
    this.assertCourierExists(courier, courierId);
    this.assertCourierStaffOperational(courier, courierId);

    const existingCutoff = courier.acceptingOrdersUntil;
    const cutoff =
      existingCutoff !== null && existingCutoff.getTime() > now.getTime()
        ? existingCutoff
        : new Date(now.getTime() + STOP_AFTER_MS);

    const updatedCourier =
      cutoff === existingCutoff
        ? courier
        : await this.repository.stopCourierWorkAfter(courierId, cutoff);
    this.assertCourierExists(updatedCourier, courierId);
    this.assertCourierStaffOperational(updatedCourier, courierId);

    return this.toAvailability(
      updatedCourier,
      await this.repository.hasBusyCourierOrder(courierId),
      now,
    );
  }

  async setCourierAutoOfferParticipation(
    courierId: DeliveryAssignmentUserId,
    enabled: boolean,
    now = new Date(),
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord> {
    const courier = await this.repository.findCourierById(courierId);
    this.assertCourierExists(courier, courierId);
    this.assertCourierStaffOperational(courier, courierId);

    const updatedCourier =
      courier.autoOfferEnabled === enabled
        ? courier
        : await this.repository.setCourierAutoOfferParticipation(courierId, enabled);
    this.assertCourierExists(updatedCourier, courierId);
    this.assertCourierStaffOperational(updatedCourier, courierId);

    return this.toAvailability(
      updatedCourier,
      await this.repository.hasBusyCourierOrder(courierId),
      now,
    );
  }

  async getCourierAvailability(
    courierId: DeliveryAssignmentUserId,
    now = new Date(),
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord> {
    const courier = await this.repository.findCourierById(courierId);
    this.assertCourierExists(courier, courierId);

    return this.toAvailability(courier, await this.repository.hasBusyCourierOrder(courierId), now);
  }

  async assignCourierOverride(input: AssignDeliveryOrderOverrideInput): Promise<DeliveryAssignmentCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Direct assignment override requires an authenticated operator", 401);
    }

    if (!ALLOWED_ASSIGNMENT_OVERRIDE_ROLES.has(actor.role)) {
      throw new AppError("FORBIDDEN", "User role cannot directly assign couriers", 403, {
        role: actor.role,
      });
    }

    if (input.override?.confirmed !== true) {
      throw new AppError(
        "CONFIRMATION_REQUIRED",
        "Direct assignment override requires explicit operator confirmation",
        400,
      );
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertAssignableOrder(order, input.orderId);

    const courier = await this.repository.findCourierById(input.courierId);

    if (
      courier === null ||
      courier.role !== "courier" ||
      !courier.isActive ||
      this.isCourierStaffDeactivated(courier)
    ) {
      throw new AppError("COURIER_INVALID", "Courier is not eligible for assignment", 400, {
        courierId: input.courierId,
      });
    }

    const assignmentArtifacts = await this.repository.assignCourier({
      orderId: order.id,
      courierId: courier.id,
      adminUserId: actor.userId,
      assignedAt: new Date(),
      auditAction: "override_assigned",
    });

    if (assignmentArtifacts === null) {
      const currentOrder = await this.repository.findOrderById(input.orderId);
      throw new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: input.orderId,
        currentStatus: currentOrder?.status ?? "UNKNOWN",
        expectedStatus: ASSIGNABLE_ORDER_STATUS,
      });
    }

    try {
      await this.notifier.notifyCourierAssigned({
        orderId: assignmentArtifacts.order.id,
        courierId: courier.id,
        courierTelegramId: courier.telegramId,
        courierName: courier.name,
        assignedByUserId: actor.userId,
        status: "ASSIGNED",
        updatedAt: assignmentArtifacts.order.updatedAt,
        revision: assignmentArtifacts.revision,
      });
    } catch {
      // Transport outages must not roll back the committed assignment semantics.
    }

    return {
      orderId: assignmentArtifacts.order.id,
      courierId: assignmentArtifacts.order.courierId ?? courier.id,
      status: "ASSIGNED",
      updatedAt: assignmentArtifacts.order.updatedAt,
      revision: assignmentArtifacts.revision,
    };
  }

  async claimOffer(
    input: ClaimDeliveryAssignmentOfferInput,
    now = new Date(),
  ): Promise<DeliveryAssignmentCommandResult> {
    if (this.repository.findOfferById === undefined) {
      throw new AppError("CLAIM_UNAVAILABLE", "Courier claim is temporarily unavailable", 503);
    }

    const offer = await this.repository.findOfferById(input.offerId);

    if (offer === null || offer.status !== "pending") {
      throw new AppError("OFFER_NOT_CLAIMABLE", "Assignment offer is not claimable", 409, {
        offerId: input.offerId,
      });
    }

    if (offer.targetCourierId !== null && offer.targetCourierId !== input.courierId) {
      throw new AppError("OFFER_NOT_CLAIMABLE", "Assignment offer does not belong to this courier", 403, {
        offerId: input.offerId,
        courierId: input.courierId,
      });
    }

    const order = await this.repository.findOrderById(offer.orderId);
    this.assertClaimableOrder(order, offer.orderId);

    const courier = await this.repository.findCourierById(input.courierId);
    this.assertCourierExists(courier, input.courierId);

    const availability = this.toAvailability(
      courier,
      await this.repository.hasBusyCourierOrder(courier.id),
      now,
    );

    if (!availability.active || !availability.free) {
      throw new AppError("COURIER_UNAVAILABLE", "Courier is not active and free for claim", 409, {
        courierId: input.courierId,
        active: availability.active,
        free: availability.free,
      });
    }

    const assignmentArtifacts = await this.repository.claimOffer({
      offerId: offer.id,
      orderId: order.id,
      courierId: courier.id,
      oldStatus: order.status,
      claimedAt: now,
    });

    if (assignmentArtifacts === null) {
      throw new AppError("OFFER_ALREADY_TAKEN", "Assignment offer is already taken or expired", 409, {
        offerId: input.offerId,
        orderId: offer.orderId,
      });
    }

    try {
      await this.notifier.notifyCourierAssigned({
        orderId: assignmentArtifacts.order.id,
        courierId: courier.id,
        courierTelegramId: courier.telegramId,
        courierName: courier.name,
        assignedByUserId: courier.id,
        status: "ASSIGNED",
        updatedAt: assignmentArtifacts.order.updatedAt,
        revision: assignmentArtifacts.revision,
      });
    } catch {
      // Transport outages must not roll back the committed claim semantics.
    }

    return {
      orderId: assignmentArtifacts.order.id,
      courierId: assignmentArtifacts.order.courierId ?? courier.id,
      status: "ASSIGNED",
      updatedAt: assignmentArtifacts.order.updatedAt,
      revision: assignmentArtifacts.revision,
    };
  }

  async createManualOffer(
    input: CreateManualDeliveryAssignmentOfferInput,
    now = new Date(),
  ): Promise<DeliveryAssignmentOfferCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Manual offer requires an authenticated operator", 401);
    }

    if (!ALLOWED_OFFER_ROLES.has(actor.role)) {
      throw new AppError("FORBIDDEN", "User role cannot create manual courier offers", 403, {
        role: actor.role,
      });
    }

    const order = await this.repository.findOrderById(input.orderId);
    this.assertManualOfferOrder(order, input.orderId);

    const courier = await this.repository.findCourierById(input.courierId);
    this.assertCourierExists(courier, input.courierId);

    const availability = this.toAvailability(
      courier,
      await this.repository.hasBusyCourierOrder(courier.id),
      now,
    );

    if (!availability.active || !availability.free) {
      throw new AppError("COURIER_UNAVAILABLE", "Courier is not active and free for a manual offer", 409, {
        courierId: input.courierId,
        active: availability.active,
        free: availability.free,
      });
    }

    const offerArtifacts = await this.repository.createManualOffer({
      orderId: order.id,
      courierId: courier.id,
      actorUserId: actor.userId,
      orderStatus: order.status,
      createdAt: now,
    });

    try {
      await this.notifier.notifyCourierOfferCreated?.({
        orderId: offerArtifacts.order.id,
        offerId: offerArtifacts.offer.id,
        targetCourierId: courier.id,
        courierTelegramId: courier.telegramId,
        courierName: courier.name,
        createdByUserId: actor.userId,
        kind: "manual",
        orderStatus: offerArtifacts.order.status as "CREATED" | "DELAYED",
        updatedAt: offerArtifacts.order.updatedAt,
        revision: offerArtifacts.revision,
      });
    } catch {
      // Transport outages must not roll back the committed pending offer.
    }

    return {
      orderId: offerArtifacts.order.id,
      offerId: offerArtifacts.offer.id,
      targetCourierId: offerArtifacts.offer.targetCourierId ?? courier.id,
      kind: "manual",
      status: "pending",
      orderStatus: offerArtifacts.order.status as "CREATED" | "DELAYED",
      updatedAt: offerArtifacts.order.updatedAt,
      revision: offerArtifacts.revision,
    };
  }

  async createBroadcastOffers(
    input: CreateBroadcastDeliveryAssignmentOfferInput,
    now = new Date(),
  ): Promise<DeliveryAssignmentBroadcastOfferCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Broadcast offer requires an authenticated operator", 401);
    }

    if (!ALLOWED_OFFER_ROLES.has(actor.role)) {
      throw new AppError("FORBIDDEN", "User role cannot create broadcast courier offers", 403, {
        role: actor.role,
      });
    }

    if (this.repository.findAutoOfferCandidateCouriers === undefined) {
      throw new AppError("AUTO_OFFER_UNAVAILABLE", "Auto-offer broadcast is temporarily unavailable", 503);
    }

    const order = await this.repository.findOrderById(input.orderId);
    this.assertManualOfferOrder(order, input.orderId);

    const candidateCouriers = await this.repository.findAutoOfferCandidateCouriers(now);
    const eligibleCouriers: DeliveryAssignmentCourierRecord[] = [];

    for (const courier of candidateCouriers) {
      const availability = this.toAvailability(
        courier,
        await this.repository.hasBusyCourierOrder(courier.id),
        now,
      );

      if (availability.active && availability.free && availability.autoOfferEnabled) {
        eligibleCouriers.push(courier);
      }
    }

    if (eligibleCouriers.length === 0) {
      throw new AppError("NO_ELIGIBLE_COURIERS", "No active free auto-offer couriers are available", 409, {
        orderId: input.orderId,
      });
    }

    const offerArtifacts = await this.repository.createBroadcastOffers({
      orderId: order.id,
      courierIds: eligibleCouriers.map((courier) => courier.id),
      actorUserId: actor.userId,
      orderStatus: order.status,
      createdAt: now,
    });

    const courierById = new Map(eligibleCouriers.map((courier) => [courier.id, courier]));
    const offers = offerArtifacts.offers.map(({ offer, event }) => ({
      orderId: offerArtifacts.order.id,
      offerId: offer.id,
      targetCourierId: offer.targetCourierId ?? "",
      kind: "broadcast" as const,
      status: "pending" as const,
      orderStatus: offerArtifacts.order.status as "CREATED" | "DELAYED",
      updatedAt: offerArtifacts.order.updatedAt,
      revision: event.id.toString(),
    }));

    for (const { offer, event } of offerArtifacts.offers) {
      const courier = offer.targetCourierId === null ? null : courierById.get(offer.targetCourierId) ?? null;

      if (courier === null) {
        continue;
      }

      try {
        await this.notifier.notifyCourierOfferCreated?.({
          orderId: offerArtifacts.order.id,
          offerId: offer.id,
          targetCourierId: courier.id,
          courierTelegramId: courier.telegramId,
          courierName: courier.name,
          createdByUserId: actor.userId,
          kind: "broadcast",
          orderStatus: offerArtifacts.order.status as "CREATED" | "DELAYED",
          updatedAt: offerArtifacts.order.updatedAt,
          revision: event.id.toString(),
        });
      } catch {
        // Transport outages must not roll back committed broadcast offers.
      }
    }

    return {
      orderId: offerArtifacts.order.id,
      kind: "broadcast",
      status: "pending",
      orderStatus: offerArtifacts.order.status as "CREATED" | "DELAYED",
      eligibleCourierCount: offers.length,
      offers,
      updatedAt: offerArtifacts.order.updatedAt,
      revision: offerArtifacts.revision,
    };
  }

  async evaluateOfferTimeouts(
    now = new Date(),
  ): Promise<DeliveryAssignmentOfferTimeoutEvaluationResult> {
    if (this.repository.evaluateOfferTimeouts === undefined) {
      throw new AppError("TIMEOUT_EVALUATOR_UNAVAILABLE", "Offer timeout evaluator is temporarily unavailable", 503);
    }

    const artifacts = await this.repository.evaluateOfferTimeouts({
      now,
      repeatAfterMs: OFFER_REPEAT_AFTER_MS,
      expireAfterMs: OFFER_EXPIRE_AFTER_MS,
    });

    for (const repeated of artifacts.repeated) {
      await this.notifyRepeatedOffer(repeated);
    }

    const timedOutByOrder = new Map<string, DeliveryAssignmentOfferTimeoutRecord[]>();
    for (const timedOut of artifacts.timedOut) {
      const existing = timedOutByOrder.get(timedOut.order.id) ?? [];
      existing.push(timedOut);
      timedOutByOrder.set(timedOut.order.id, existing);
    }

    const operatorTelegramIds = artifacts.operatorTargets.map((target) => target.telegramId);
    let operatorNotificationCount = 0;
    for (const [orderId, timedOutRecords] of timedOutByOrder) {
      if (operatorTelegramIds.length === 0) {
        continue;
      }

      const revision = timedOutRecords[0].delayedEvent?.id.toString() ?? timedOutRecords[0].timeoutEvent.id.toString();

      try {
        await this.notifier.notifyOperatorsAssignmentDelayed?.({
          orderId,
          operatorTelegramIds,
          expiredOfferCount: timedOutRecords.length,
          updatedAt: timedOutRecords[0].order.updatedAt,
          revision,
        });
        operatorNotificationCount += operatorTelegramIds.length;
      } catch {
        // Transport outages must not roll back committed timeout/delayed artifacts.
      }
    }

    return {
      evaluatedAt: now,
      repeatedOfferCount: artifacts.repeated.length,
      expiredOfferCount: artifacts.timedOut.length,
      delayedOrderCount: artifacts.timedOut.filter((record) => record.delayedEvent !== null).length,
      penalizedCourierCount: artifacts.timedOut.filter((record) => record.penalizedCourierId !== null).length,
      operatorNotificationCount,
      revision: artifacts.revision,
    };
  }

  private async notifyRepeatedOffer(repeated: DeliveryAssignmentOfferRepeatRecord): Promise<void> {
    if (repeated.courier === null) {
      return;
    }

    try {
      await this.notifier.notifyCourierOfferRepeated?.({
        orderId: repeated.order.id,
        offerId: repeated.offer.id,
        targetCourierId: repeated.courier.id,
        courierTelegramId: repeated.courier.telegramId,
        courierName: repeated.courier.name,
        createdByUserId: "system",
        kind: repeated.offer.kind,
        orderStatus: repeated.order.status,
        updatedAt: repeated.order.updatedAt,
        revision: repeated.event.id.toString(),
      });
    } catch {
      // Transport outages must not roll back committed repeat artifacts.
    }
  }

  private assertAssignableOrder(
    order: DeliveryAssignmentOrderRecord | null,
    orderId: DeliveryAssignmentOrderId,
  ): asserts order is DeliveryAssignmentOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (order.status !== ASSIGNABLE_ORDER_STATUS) {
      throw new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: ASSIGNABLE_ORDER_STATUS,
      });
    }

    if (order.courierId !== null) {
      throw new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: ASSIGNABLE_ORDER_STATUS,
      });
    }
  }

  private assertClaimableOrder(
    order: DeliveryAssignmentOrderRecord | null,
    orderId: DeliveryAssignmentOrderId,
  ): asserts order is DeliveryAssignmentOrderRecord & { status: "CREATED" | "DELAYED"; courierId: null } {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (!CLAIMABLE_ORDER_STATUSES.has(order.status)) {
      throw new AppError("CONFLICT", "Order cannot be claimed from the current state", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: "CREATED,DELAYED",
      });
    }

    if (order.courierId !== null) {
      throw new AppError("OFFER_ALREADY_TAKEN", "Order is already assigned", 409, {
        orderId,
        courierId: order.courierId,
      });
    }
  }

  private assertManualOfferOrder(
    order: DeliveryAssignmentOrderRecord | null,
    orderId: DeliveryAssignmentOrderId,
  ): asserts order is DeliveryAssignmentOrderRecord & { status: "CREATED" | "DELAYED" } {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (!MANUAL_OFFER_ORDER_STATUSES.has(order.status)) {
      throw new AppError("CONFLICT", "Manual offer can only be created for CREATED or DELAYED orders", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: "CREATED,DELAYED",
      });
    }
  }

  private assertCourierExists(
    courier: DeliveryAssignmentCourierRecord | null,
    courierId: DeliveryAssignmentUserId,
  ): asserts courier is DeliveryAssignmentCourierRecord {
    if (courier === null || courier.role !== "courier") {
      throw new AppError("COURIER_NOT_FOUND", "Courier was not found", 404, {
        courierId,
      });
    }
  }

  private assertCourierStaffOperational(
    courier: DeliveryAssignmentCourierRecord,
    courierId: DeliveryAssignmentUserId,
  ): void {
    if (this.isCourierStaffDeactivated(courier)) {
      throw new AppError("COURIER_STAFF_INACTIVE", "Courier staff is deactivated", 409, {
        courierId,
        staffDeactivatedAt: courier.staffDeactivatedAt?.toISOString() ?? null,
      });
    }
  }

  private isCourierStaffDeactivated(courier: DeliveryAssignmentCourierRecord): boolean {
    return courier.staffDeactivatedAt != null;
  }

  private getCourierStaffRepository(): DeliveryAssignmentCourierStaffRepository {
    return this.courierStaffRepository;
  }

  private assertStaffPanelActor(
    actor: DeliveryAssignmentStaffPanelActor,
  ): DeliveryAssignmentStaffPanelActor {
    if (!ALLOWED_STAFF_PANEL_ROLES.has(actor.role)) {
      throw new AppError("FORBIDDEN", "Staff panel courier command requires admin or boss access", 403);
    }

    return actor;
  }

  private assertBossStaffPanelActor(
    actor: DeliveryAssignmentStaffPanelActor,
  ): DeliveryAssignmentStaffPanelActor {
    if (actor.role !== "boss") {
      throw new AppError("FORBIDDEN", "Courier staff reactivation requires boss access", 403);
    }

    return actor;
  }

  private assertCourierStaffTarget(
    courier: DeliveryAssignmentCourierStaffIdentityRecord | null,
    courierUserId: DeliveryAssignmentUserId,
  ): DeliveryAssignmentCourierStaffRecord {
    if (courier === null || courier.role !== "courier") {
      throw new AppError("COURIER_STAFF_NOT_FOUND", "Courier staff was not found", 404, {
        courierUserId,
      });
    }

    return {
      ...courier,
      role: "courier",
    };
  }

  private toAvailability(
    courier: DeliveryAssignmentCourierRecord,
    hasBusyOrder: boolean,
    now: Date,
  ): DeliveryAssignmentCourierAvailabilityRecord {
    const staffActive = !this.isCourierStaffDeactivated(courier);
    const active =
      staffActive &&
      courier.isActive &&
      (courier.acceptingOrdersUntil === null ||
        courier.acceptingOrdersUntil.getTime() > now.getTime());

    return {
      courierId: courier.id,
      active,
      free: !hasBusyOrder,
      autoOfferEnabled: staffActive && courier.autoOfferEnabled,
      acceptingOrdersUntil: courier.acceptingOrdersUntil,
      ratingScore: courier.ratingScore,
    };
  }
}

const normalizeRequiredValue = (value: string, fieldName: string): string => {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new AppError("VALIDATION_ERROR", `${fieldName} is required`, 400, {
      field: fieldName,
    });
  }

  return normalized;
};

const normalizeOptionalReason = (reason?: string | null): string | null => {
  const normalized = reason?.trim() ?? "";

  return normalized.length === 0 ? null : normalized;
};
