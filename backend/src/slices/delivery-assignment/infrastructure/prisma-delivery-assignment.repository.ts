import type {
  CreateDeliveryAssignmentAuditInput,
  CreateDeliveryAssignmentEventInput,
  CreateDeliveryAssignmentStatusHistoryInput,
  DeliveryAssignmentArtifactsRecord,
  DeliveryAssignmentAuditRecord,
  DeliveryAssignmentCourierRecord,
  DeliveryAssignmentOfferKind,
  DeliveryAssignmentOfferRecord,
  DeliveryAssignmentOfferStatus,
  DeliveryAssignmentOfferTimeoutEvaluationArtifacts,
  DeliveryAssignmentOperatorNotificationTarget,
  DeliveryAssignmentOrderRecord,
  DeliveryAssignmentOrderStatus,
  DeliveryAssignmentRepository,
  DeliveryAssignmentUserRole,
  EvaluateDeliveryAssignmentOfferTimeoutsInput,
  PersistClaimDeliveryAssignmentOfferInput,
  PersistBroadcastDeliveryAssignmentOffersInput,
  PersistManualDeliveryAssignmentOfferInput,
  PersistDeliveryAssignmentInput,
} from "../domain/delivery-assignment.types";

type DeliveryAssignmentOrderFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    courierId: true;
    status: true;
    updatedAt: true;
    isDeleted: true;
  };
};

type DeliveryAssignmentCourierFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    telegramId: true;
    role: true;
    isActive: true;
    acceptingOrdersUntil: true;
    autoOfferEnabled: true;
    ratingScore: true;
    name: true;
  };
};

type DeliveryAssignmentCourierUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    isActive?: boolean;
    acceptingOrdersUntil?: Date | null;
    autoOfferEnabled?: boolean;
    ratingScore?: {
      decrement: number;
    };
  };
  select: DeliveryAssignmentCourierFindUniqueArgs["select"];
};

type DeliveryAssignmentCourierFindManyArgs = {
  where:
    | {
        role: "COURIER";
        isActive: true;
        autoOfferEnabled: true;
        OR: Array<
          | {
              acceptingOrdersUntil: null;
            }
          | {
              acceptingOrdersUntil: {
                gt: Date;
              };
            }
        >;
      }
    | {
        role: {
          in: Array<"BOSS" | "MANAGER" | "OPERATOR" | "ADMIN">;
        };
        isActive: true;
      };
  select: DeliveryAssignmentCourierFindUniqueArgs["select"];
};

type DeliveryAssignmentBusyOrderFindFirstArgs = {
  where: {
    courierId: string;
    isDeleted: false;
    status: {
      in: Array<"ASSIGNED" | "PICKED_UP" | "IN_PROGRESS" | "DELIVERED">;
    };
  };
  select: {
    id: true;
  };
};

type DeliveryAssignmentOfferFindManyArgs = {
  where: {
    id?: string;
    orderId?: string;
    targetCourierId?: string | null;
    status?: "PENDING" | "CLAIMED" | "EXPIRED" | "CANCELLED";
    createdAt?: {
      lte: Date;
    };
  };
  select: {
    id: true;
    orderId: true;
    targetCourierId: true;
    kind: true;
    status: true;
    createdAt: true;
    updatedAt: true;
  };
};

type DeliveryAssignmentOfferFindUniqueArgs = {
  where: {
    id: string;
  };
  select: DeliveryAssignmentOfferFindManyArgs["select"];
};

type DeliveryAssignmentOfferCreateArgs = {
  data: {
    orderId: string;
    targetCourierId: string;
    kind: "MANUAL" | "BROADCAST";
    status: "PENDING";
    createdAt: Date;
  };
  select: {
    id: true;
    orderId: true;
    targetCourierId: true;
    kind: true;
    status: true;
    createdAt: true;
    updatedAt: true;
  };
};

type DeliveryAssignmentOfferUpdateManyArgs = {
  where: {
    id?: string | { not: string };
    orderId?: string;
    status?: "PENDING" | "CLAIMED" | "EXPIRED" | "CANCELLED";
  };
  data: {
    status: "CLAIMED" | "CANCELLED" | "EXPIRED";
  };
};

type DeliveryAssignmentStatusHistoryCreateArgs = {
  data: CreateDeliveryAssignmentStatusHistoryInput;
};

type DeliveryAssignmentOrderUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    courierId: string;
    status: "ASSIGNED";
  };
  select: {
    id: true;
    courierId: true;
    status: true;
    updatedAt: true;
    isDeleted: true;
  };
};

type DeliveryAssignmentOrderUpdateManyArgs = {
  where: {
    id: string;
    courierId?: null;
    isDeleted: false;
    status:
      | "CREATED"
      | {
          in: Array<"CREATED" | "DELAYED">;
        };
  };
  data: {
    courierId?: string;
    status: "ASSIGNED" | "DELAYED";
  };
};

type DeliveryAssignmentAuditCreateArgs = {
  data: CreateDeliveryAssignmentAuditInput;
};

type DeliveryAssignmentEventCreateArgs = {
  data: CreateDeliveryAssignmentEventInput;
};

type DeliveryAssignmentEventFindManyArgs = {
  where: {
    entity: "order";
    entityId?: string;
    type?: {
      in: string[];
    };
  };
  select: {
    id: true;
    type: true;
    entity: true;
    entityId: true;
    payload: true;
    createdAt: true;
  };
};

type DeliveryAssignmentStatusHistoryRecord = CreateDeliveryAssignmentStatusHistoryInput & {
  id: bigint;
};

type DeliveryAssignmentEventRecord = CreateDeliveryAssignmentEventInput & {
  id: bigint;
  createdAt: Date;
};

export type DeliveryAssignmentPrismaClientLike = {
  order: {
    findUnique(args: DeliveryAssignmentOrderFindUniqueArgs): Promise<DeliveryAssignmentOrderRecord | null>;
    update(args: DeliveryAssignmentOrderUpdateArgs): Promise<DeliveryAssignmentOrderRecord>;
    updateMany?(args: DeliveryAssignmentOrderUpdateManyArgs): Promise<{ count: number }>;
    findFirst?(args: DeliveryAssignmentBusyOrderFindFirstArgs): Promise<{ id: string } | null>;
  };
  user: {
    findUnique(args: DeliveryAssignmentCourierFindUniqueArgs): Promise<DeliveryAssignmentCourierRecord | null>;
    findMany?(args: DeliveryAssignmentCourierFindManyArgs): Promise<DeliveryAssignmentCourierRecord[]>;
    update?(args: DeliveryAssignmentCourierUpdateArgs): Promise<DeliveryAssignmentCourierRecord>;
  };
  assignmentOffer?: {
    findUnique?(args: DeliveryAssignmentOfferFindUniqueArgs): Promise<{
      id: string;
      orderId: string;
      targetCourierId: string | null;
      kind: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
    findMany(args: DeliveryAssignmentOfferFindManyArgs): Promise<Array<{
      id: string;
      orderId: string;
      targetCourierId: string | null;
      kind: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>>;
    create?(args: DeliveryAssignmentOfferCreateArgs): Promise<{
      id: string;
      orderId: string;
      targetCourierId: string | null;
      kind: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    updateMany?(args: DeliveryAssignmentOfferUpdateManyArgs): Promise<{ count: number }>;
  };
  orderStatusHistory: {
    create(args: DeliveryAssignmentStatusHistoryCreateArgs): Promise<DeliveryAssignmentStatusHistoryRecord>;
  };
  deliveryAssignmentAudit: {
    create(args: DeliveryAssignmentAuditCreateArgs): Promise<DeliveryAssignmentAuditRecord>;
  };
  event: {
    create(args: DeliveryAssignmentEventCreateArgs): Promise<DeliveryAssignmentEventRecord>;
    findMany?(args: DeliveryAssignmentEventFindManyArgs): Promise<DeliveryAssignmentEventRecord[]>;
  };
};

type DeliveryAssignmentPrismaTransactionalClientLike = DeliveryAssignmentPrismaClientLike & {
  $transaction<T>(callback: (client: DeliveryAssignmentPrismaClientLike) => Promise<T>): Promise<T>;
};

export type DeliveryAssignmentPrismaProvider = {
  readonly client: DeliveryAssignmentPrismaTransactionalClientLike;
};

const mapUserRole = (role: string): DeliveryAssignmentUserRole => role.toLowerCase() as DeliveryAssignmentUserRole;

const mapOrderStatus = (status: string): DeliveryAssignmentOrderStatus =>
  status as DeliveryAssignmentOrderStatus;

const mapOfferKind = (kind: string): DeliveryAssignmentOfferKind =>
  kind.toLowerCase() as DeliveryAssignmentOfferKind;

const mapOfferStatus = (status: string): DeliveryAssignmentOfferStatus =>
  status.toLowerCase() as DeliveryAssignmentOfferStatus;

const selectCourierFields = {
  id: true,
  telegramId: true,
  role: true,
  isActive: true,
  acceptingOrdersUntil: true,
  autoOfferEnabled: true,
  ratingScore: true,
  name: true,
} as const;

const BUSY_COURIER_ORDER_STATUSES = [
  "ASSIGNED",
  "PICKED_UP",
  "IN_PROGRESS",
  "DELIVERED",
] as const;

export class PrismaDeliveryAssignmentRepository implements DeliveryAssignmentRepository {
  constructor(private readonly prisma: DeliveryAssignmentPrismaProvider) {}

  async findOrderById(orderId: string): Promise<DeliveryAssignmentOrderRecord | null> {
    const order = await this.prisma.client.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });

    if (order === null) {
      return null;
    }

    return {
      ...order,
      status: mapOrderStatus(order.status),
    };
  }

  async findCourierById(courierId: string): Promise<DeliveryAssignmentCourierRecord | null> {
    const courier = await this.prisma.client.user.findUnique({
      where: {
        id: courierId,
      },
      select: selectCourierFields,
    });

    if (courier === null) {
      return null;
    }

    return {
      ...courier,
      role: mapUserRole(courier.role),
    };
  }

  async findAutoOfferCandidateCouriers(now: Date): Promise<DeliveryAssignmentCourierRecord[]> {
    if (this.prisma.client.user.findMany === undefined) {
      throw new Error("Prisma user.findMany is required for auto-offer courier reads");
    }

    const couriers = await this.prisma.client.user.findMany({
      where: {
        role: "COURIER",
        isActive: true,
        autoOfferEnabled: true,
        OR: [
          {
            acceptingOrdersUntil: null,
          },
          {
            acceptingOrdersUntil: {
              gt: now,
            },
          },
        ],
      },
      select: selectCourierFields,
    });

    return couriers.map((courier) => this.mapCourier(courier));
  }

  async findOperatorNotificationTargets(): Promise<DeliveryAssignmentOperatorNotificationTarget[]> {
    return this.readOperatorNotificationTargets(this.prisma.client);
  }

  async startCourierWork(courierId: string): Promise<DeliveryAssignmentCourierRecord | null> {
    if (this.prisma.client.user.update === undefined) {
      throw new Error("Prisma user.update is required for courier availability writes");
    }

    return this.mapCourier(
      await this.prisma.client.user.update({
        where: {
          id: courierId,
        },
        data: {
          isActive: true,
          acceptingOrdersUntil: null,
        },
        select: selectCourierFields,
      }),
    );
  }

  async stopCourierWorkAfter(
    courierId: string,
    acceptingOrdersUntil: Date,
  ): Promise<DeliveryAssignmentCourierRecord | null> {
    if (this.prisma.client.user.update === undefined) {
      throw new Error("Prisma user.update is required for courier availability writes");
    }

    return this.mapCourier(
      await this.prisma.client.user.update({
        where: {
          id: courierId,
        },
        data: {
          isActive: true,
          acceptingOrdersUntil,
        },
        select: selectCourierFields,
      }),
    );
  }

  async setCourierAutoOfferParticipation(
    courierId: string,
    enabled: boolean,
  ): Promise<DeliveryAssignmentCourierRecord | null> {
    if (this.prisma.client.user.update === undefined) {
      throw new Error("Prisma user.update is required for courier availability writes");
    }

    return this.mapCourier(
      await this.prisma.client.user.update({
        where: {
          id: courierId,
        },
        data: {
          autoOfferEnabled: enabled,
        },
        select: selectCourierFields,
      }),
    );
  }

  async hasBusyCourierOrder(courierId: string): Promise<boolean> {
    if (this.prisma.client.order.findFirst === undefined) {
      throw new Error("Prisma order.findFirst is required for courier availability reads");
    }

    const busyOrder = await this.prisma.client.order.findFirst({
      where: {
        courierId,
        isDeleted: false,
        status: {
          in: [...BUSY_COURIER_ORDER_STATUSES],
        },
      },
      select: {
        id: true,
      },
    });

    return busyOrder !== null;
  }

  async findOffersForOrder(orderId: string): Promise<DeliveryAssignmentOfferRecord[]> {
    const offers = await this.prisma.client.assignmentOffer?.findMany({
      where: {
        orderId,
      },
      select: {
        id: true,
        orderId: true,
        targetCourierId: true,
        kind: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return (offers ?? []).map((offer) => ({
      ...offer,
      kind: mapOfferKind(offer.kind),
      status: mapOfferStatus(offer.status),
    }));
  }

  async findOfferById(offerId: string): Promise<DeliveryAssignmentOfferRecord | null> {
    const offer =
      (await this.prisma.client.assignmentOffer?.findUnique?.({
        where: {
          id: offerId,
        },
        select: {
          id: true,
          orderId: true,
          targetCourierId: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })) ??
      (await this.prisma.client.assignmentOffer?.findMany({
        where: {
          id: offerId,
        },
        select: {
          id: true,
          orderId: true,
          targetCourierId: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }))?.[0] ??
      null;

    if (offer === null) {
      return null;
    }

    return {
      ...offer,
      kind: mapOfferKind(offer.kind),
      status: mapOfferStatus(offer.status),
    };
  }

  createManualOffer(input: PersistManualDeliveryAssignmentOfferInput) {
    if (this.prisma.client.assignmentOffer?.create === undefined) {
      throw new Error("Prisma assignmentOffer.create is required for manual offer writes");
    }

    return this.prisma.client.$transaction(async (transactionClient) => {
      if (transactionClient.assignmentOffer?.create === undefined) {
        throw new Error("Prisma assignmentOffer.create is required for manual offer writes");
      }

      const offer = await transactionClient.assignmentOffer.create({
        data: {
          orderId: input.orderId,
          targetCourierId: input.courierId,
          kind: "MANUAL",
          status: "PENDING",
          createdAt: input.createdAt,
        },
        select: {
          id: true,
          orderId: true,
          targetCourierId: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const order = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (order === null) {
        throw new Error(`Manual offer order ${input.orderId} disappeared during persistence`);
      }

      const event = await transactionClient.event.create({
        data: {
          type: "order.offer_created",
          entity: "order",
          entityId: input.orderId,
          payload: {
            orderId: input.orderId,
            offerId: offer.id,
            targetCourierId: input.courierId,
            createdByUserId: input.actorUserId,
            kind: "manual",
            status: "pending",
            orderStatus: input.orderStatus,
            updatedAt: order.updatedAt.toISOString(),
          },
        },
      });

      return {
        offer: {
          ...offer,
          kind: mapOfferKind(offer.kind),
          status: mapOfferStatus(offer.status),
        },
        event,
        order: {
          ...order,
          status: mapOrderStatus(order.status),
        },
        revision: event.id.toString(),
      };
    });
  }

  createBroadcastOffers(input: PersistBroadcastDeliveryAssignmentOffersInput) {
    if (this.prisma.client.assignmentOffer?.create === undefined) {
      throw new Error("Prisma assignmentOffer.create is required for broadcast offer writes");
    }

    return this.prisma.client.$transaction(async (transactionClient) => {
      if (transactionClient.assignmentOffer?.create === undefined) {
        throw new Error("Prisma assignmentOffer.create is required for broadcast offer writes");
      }

      const order = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (order === null) {
        throw new Error(`Broadcast offer order ${input.orderId} disappeared during persistence`);
      }

      const offers = [];

      for (const courierId of input.courierIds) {
        const offer = await transactionClient.assignmentOffer.create({
          data: {
            orderId: input.orderId,
            targetCourierId: courierId,
            kind: "BROADCAST",
            status: "PENDING",
            createdAt: input.createdAt,
          },
          select: {
            id: true,
            orderId: true,
            targetCourierId: true,
            kind: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        const event = await transactionClient.event.create({
          data: {
            type: "order.offer_created",
            entity: "order",
            entityId: input.orderId,
            payload: {
              orderId: input.orderId,
              offerId: offer.id,
              targetCourierId: courierId,
              createdByUserId: input.actorUserId,
              kind: "broadcast",
              status: "pending",
              orderStatus: input.orderStatus,
              updatedAt: order.updatedAt.toISOString(),
            },
          },
        });

        offers.push({
          offer: {
            ...offer,
            kind: mapOfferKind(offer.kind),
            status: mapOfferStatus(offer.status),
          },
          event,
        });
      }

      return {
        offers,
        order: {
          ...order,
          status: mapOrderStatus(order.status),
        },
        revision: offers.at(-1)?.event.id.toString() ?? "0",
      };
    });
  }

  claimOffer(
    input: PersistClaimDeliveryAssignmentOfferInput,
  ): Promise<DeliveryAssignmentArtifactsRecord | null> {
    if (this.prisma.client.assignmentOffer?.updateMany === undefined) {
      throw new Error("Prisma assignmentOffer.updateMany is required for offer claim writes");
    }

    if (this.prisma.client.order.updateMany === undefined) {
      throw new Error("Prisma order.updateMany is required for atomic offer claim writes");
    }

    return this.prisma.client.$transaction(async (transactionClient) => {
      if (
        transactionClient.assignmentOffer?.updateMany === undefined ||
        transactionClient.order.updateMany === undefined ||
        transactionClient.order.findFirst === undefined
      ) {
        throw new Error("Prisma updateMany/findFirst methods are required for offer claim writes");
      }

      const busyOrder = await transactionClient.order.findFirst({
        where: {
          courierId: input.courierId,
          isDeleted: false,
          status: {
            in: [...BUSY_COURIER_ORDER_STATUSES],
          },
        },
        select: {
          id: true,
        },
      });

      if (busyOrder !== null) {
        return null;
      }

      const orderUpdate = await transactionClient.order.updateMany({
        where: {
          id: input.orderId,
          courierId: null,
          isDeleted: false,
          status: {
            in: ["CREATED", "DELAYED"],
          },
        },
        data: {
          courierId: input.courierId,
          status: "ASSIGNED",
        },
      });

      if (orderUpdate.count !== 1) {
        return null;
      }

      const offerUpdate = await transactionClient.assignmentOffer.updateMany({
        where: {
          id: input.offerId,
          status: "PENDING",
        },
        data: {
          status: "CLAIMED",
        },
      });

      if (offerUpdate.count !== 1) {
        throw new Error("CLAIM_CONFLICT: offer was not pending during claim");
      }

      await transactionClient.assignmentOffer.updateMany({
        where: {
          orderId: input.orderId,
          status: "PENDING",
          id: {
            not: input.offerId,
          },
        },
        data: {
          status: "CANCELLED",
        },
      });

      const order = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (order === null) {
        throw new Error(`Claimed order ${input.orderId} disappeared during persistence`);
      }

      const statusHistoryInput = {
        orderId: input.orderId,
        oldStatus: input.oldStatus,
        newStatus: "ASSIGNED" as const,
        changedByUserId: input.courierId,
        changedAt: input.claimedAt,
      };
      const statusHistory = await transactionClient.orderStatusHistory.create({
        data: statusHistoryInput,
      });
      const auditInput = {
        orderId: input.orderId,
        adminUserId: input.courierId,
        courierUserId: input.courierId,
        action: "assigned" as const,
        createdAt: input.claimedAt,
      };
      const audit = await transactionClient.deliveryAssignmentAudit.create({
        data: auditInput,
      });
      const eventInput = {
        type: "order.assigned" as const,
        entity: "order" as const,
        entityId: input.orderId,
        payload: {
          orderId: input.orderId,
          courierId: input.courierId,
          assignedByUserId: input.courierId,
          status: "ASSIGNED" as const,
          updatedAt: order.updatedAt.toISOString(),
        },
      };
      const event = await transactionClient.event.create({
        data: eventInput,
      });

      return {
        order: {
          ...order,
          status: mapOrderStatus(order.status),
        },
        statusHistory,
        audit,
        event,
        revision: event.id.toString(),
      };
    }).catch((error) => {
      if (error instanceof Error && error.message.startsWith("CLAIM_CONFLICT:")) {
        return null;
      }

      throw error;
    });
  }

  evaluateOfferTimeouts(
    input: EvaluateDeliveryAssignmentOfferTimeoutsInput,
  ): Promise<DeliveryAssignmentOfferTimeoutEvaluationArtifacts> {
    if (this.prisma.client.assignmentOffer?.findMany === undefined) {
      throw new Error("Prisma assignmentOffer.findMany is required for offer timeout reads");
    }

    if (this.prisma.client.assignmentOffer.updateMany === undefined) {
      throw new Error("Prisma assignmentOffer.updateMany is required for offer timeout writes");
    }

    if (this.prisma.client.order.updateMany === undefined) {
      throw new Error("Prisma order.updateMany is required for offer timeout writes");
    }

    if (this.prisma.client.event.findMany === undefined) {
      throw new Error("Prisma event.findMany is required for offer timeout idempotency");
    }

    const repeatCutoff = new Date(input.now.getTime() - input.repeatAfterMs);
    const expireCutoff = new Date(input.now.getTime() - input.expireAfterMs);

    return this.prisma.client.$transaction(async (transactionClient) => {
      if (
        transactionClient.assignmentOffer?.findMany === undefined ||
        transactionClient.assignmentOffer.updateMany === undefined ||
        transactionClient.order.updateMany === undefined ||
        transactionClient.event.findMany === undefined
      ) {
        throw new Error("Prisma transaction methods are required for offer timeout evaluation");
      }

      const candidates = await transactionClient.assignmentOffer.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lte: repeatCutoff,
          },
        },
        select: {
          id: true,
          orderId: true,
          targetCourierId: true,
          kind: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const repeated: DeliveryAssignmentOfferTimeoutEvaluationArtifacts["repeated"] = [];
      const timedOut: DeliveryAssignmentOfferTimeoutEvaluationArtifacts["timedOut"] = [];
      let revision = "0";

      for (const rawOffer of candidates) {
        const offer = {
          ...rawOffer,
          kind: mapOfferKind(rawOffer.kind),
          status: mapOfferStatus(rawOffer.status),
        } as DeliveryAssignmentOfferRecord & { status: "pending" };
        const order = await transactionClient.order.findUnique({
          where: {
            id: offer.orderId,
          },
          select: {
            id: true,
            courierId: true,
            status: true,
            updatedAt: true,
            isDeleted: true,
          },
        });

        if (
          order === null ||
          order.isDeleted ||
          order.courierId !== null ||
          (order.status !== "CREATED" && order.status !== "DELAYED")
        ) {
          continue;
        }

        const existingEvents = await transactionClient.event.findMany({
          where: {
            entity: "order",
            entityId: order.id,
            type: {
              in: ["order.offer_repeated", "order.assignment_timeout", "order.delayed"],
            },
          },
          select: {
            id: true,
            type: true,
            entity: true,
            entityId: true,
            payload: true,
            createdAt: true,
          },
        });
        const hasOfferEvent = (eventType: string) =>
          existingEvents.some(
            (event) =>
              event.type === eventType &&
              hasPayloadOfferId(event.payload, offer.id),
          );

        if (offer.createdAt.getTime() <= expireCutoff.getTime()) {
          if (hasOfferEvent("order.assignment_timeout")) {
            continue;
          }

          const expireUpdate = await transactionClient.assignmentOffer.updateMany({
            where: {
              id: offer.id,
              status: "PENDING",
            },
            data: {
              status: "EXPIRED",
            },
          });

          if (expireUpdate.count !== 1) {
            continue;
          }

          let penalizedCourierId: string | null = null;
          if (
            offer.kind === "manual" &&
            offer.targetCourierId !== null &&
            transactionClient.user.update !== undefined
          ) {
            await transactionClient.user.update({
              where: {
                id: offer.targetCourierId,
              },
              data: {
                ratingScore: {
                  decrement: 1,
                },
              },
              select: selectCourierFields,
            });
            penalizedCourierId = offer.targetCourierId;
          }

          const delayedUpdate =
            order.status === "CREATED"
              ? await transactionClient.order.updateMany({
                  where: {
                    id: order.id,
                    courierId: null,
                    isDeleted: false,
                    status: {
                      in: ["CREATED"],
                    },
                  },
                  data: {
                    status: "DELAYED",
                  },
                })
              : { count: 0 };
          const persistedOrder = await transactionClient.order.findUnique({
            where: {
              id: order.id,
            },
            select: {
              id: true,
              courierId: true,
              status: true,
              updatedAt: true,
              isDeleted: true,
            },
          });

          if (
            persistedOrder === null ||
            persistedOrder.courierId !== null ||
            (persistedOrder.status !== "CREATED" && persistedOrder.status !== "DELAYED")
          ) {
            continue;
          }

          const statusHistory =
            delayedUpdate.count === 1
              ? await transactionClient.orderStatusHistory.create({
                  data: {
                    orderId: order.id,
                    oldStatus: "CREATED",
                    newStatus: "DELAYED",
                    changedByUserId: "system",
                    changedAt: input.now,
                  },
                })
              : null;
          const timeoutEvent = await transactionClient.event.create({
            data: {
              type: "order.assignment_timeout",
              entity: "order",
              entityId: order.id,
              payload: {
                orderId: order.id,
                offerId: offer.id,
                targetCourierId: offer.targetCourierId,
                kind: offer.kind,
                status: "expired",
                orderStatus: order.status as "CREATED" | "DELAYED",
                updatedAt: persistedOrder.updatedAt.toISOString(),
              },
            },
          });
          const delayedEvent =
            delayedUpdate.count === 1
              ? await transactionClient.event.create({
                  data: {
                    type: "order.delayed",
                    entity: "order",
                    entityId: order.id,
                    payload: {
                      orderId: order.id,
                      oldStatus: "CREATED",
                      newStatus: "DELAYED",
                      reason: "assignment_timeout",
                      updatedAt: persistedOrder.updatedAt.toISOString(),
                    },
                  },
                })
              : null;

          revision = (delayedEvent ?? timeoutEvent).id.toString();
          timedOut.push({
            offer: {
              ...offer,
              status: "expired",
            },
            order: {
              ...persistedOrder,
              status: mapOrderStatus(persistedOrder.status) as "CREATED" | "DELAYED",
            },
            timeoutEvent,
            delayedEvent,
            statusHistory,
            penalizedCourierId,
          });
          continue;
        }

        if (hasOfferEvent("order.offer_repeated")) {
          continue;
        }

        const event = await transactionClient.event.create({
          data: {
            type: "order.offer_repeated",
            entity: "order",
            entityId: order.id,
            payload: {
              orderId: order.id,
              offerId: offer.id,
              targetCourierId: offer.targetCourierId,
              kind: offer.kind,
              status: "pending",
              orderStatus: order.status as "CREATED" | "DELAYED",
              updatedAt: order.updatedAt.toISOString(),
            },
          },
        });
        const courier =
          offer.targetCourierId === null
            ? null
            : await transactionClient.user.findUnique({
                where: {
                  id: offer.targetCourierId,
                },
                select: selectCourierFields,
              });

        revision = event.id.toString();
        repeated.push({
          offer,
          order: {
            ...order,
            status: mapOrderStatus(order.status) as "CREATED" | "DELAYED",
          },
          courier: courier === null ? null : this.mapCourier(courier),
          event,
        });
      }

      return {
        repeated,
        timedOut,
        operatorTargets: await this.readOperatorNotificationTargets(transactionClient),
        revision,
      };
    });
  }

  assignCourier(
    input: PersistDeliveryAssignmentInput,
  ): Promise<DeliveryAssignmentArtifactsRecord | null> {
    if (this.prisma.client.order.updateMany === undefined) {
      throw new Error("Prisma order.updateMany is required for atomic assignment override writes");
    }

    return this.prisma.client.$transaction(async (transactionClient) => {
      if (transactionClient.order.updateMany === undefined) {
        throw new Error("Prisma order.updateMany is required for atomic assignment override writes");
      }

      const orderUpdate = await transactionClient.order.updateMany({
        where: {
          id: input.orderId,
          courierId: null,
          isDeleted: false,
          status: "CREATED",
        },
        data: {
          courierId: input.courierId,
          status: "ASSIGNED",
        },
      });

      if (orderUpdate.count !== 1) {
        return null;
      }

      const order = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (order === null) {
        throw new Error(`Assigned order ${input.orderId} disappeared during persistence`);
      }

      const statusHistoryInput = {
        orderId: input.orderId,
        oldStatus: "CREATED" as const,
        newStatus: "ASSIGNED" as const,
        changedByUserId: input.adminUserId,
        changedAt: input.assignedAt,
      };
      const statusHistory = await transactionClient.orderStatusHistory.create({
        data: statusHistoryInput,
      });
      const auditInput = {
        orderId: input.orderId,
        adminUserId: input.adminUserId,
        courierUserId: input.courierId,
        action: input.auditAction,
        createdAt: input.assignedAt,
      };
      const audit = await transactionClient.deliveryAssignmentAudit.create({
        data: auditInput,
      });
      const eventInput = {
        type: "order.assigned" as const,
        entity: "order" as const,
        entityId: input.orderId,
        payload: {
          orderId: input.orderId,
          courierId: input.courierId,
          assignedByUserId: input.adminUserId,
          status: "ASSIGNED" as const,
          updatedAt: order.updatedAt.toISOString(),
        },
      };
      const event = await transactionClient.event.create({
        data: eventInput,
      });

      return {
        order: {
          ...order,
          status: mapOrderStatus(order.status),
        },
        statusHistory,
        audit,
        event,
        revision: event.id.toString(),
      };
    });
  }

  private mapCourier(
    courier: DeliveryAssignmentCourierRecord,
  ): DeliveryAssignmentCourierRecord {
    return {
      ...courier,
      role: mapUserRole(courier.role),
    };
  }

  private async readOperatorNotificationTargets(
    client: DeliveryAssignmentPrismaClientLike,
  ): Promise<DeliveryAssignmentOperatorNotificationTarget[]> {
    if (client.user.findMany === undefined) {
      return [];
    }

    const users = await client.user.findMany({
      where: {
        role: {
          in: ["BOSS", "MANAGER", "OPERATOR", "ADMIN"],
        },
        isActive: true,
      },
      select: selectCourierFields,
    });

    return users.map((user) => ({
      userId: user.id,
      telegramId: user.telegramId,
      name: user.name,
      role: mapUserRole(user.role) as DeliveryAssignmentOperatorNotificationTarget["role"],
    }));
  }
}

const hasPayloadOfferId = (payload: unknown, offerId: string): boolean =>
  typeof payload === "object" &&
  payload !== null &&
  "offerId" in payload &&
  (payload as { offerId?: unknown }).offerId === offerId;
