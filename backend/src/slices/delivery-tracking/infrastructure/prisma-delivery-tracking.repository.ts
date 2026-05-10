import type {
  CreateDeliveryTrackingEventInput,
  CreateDeliveryTrackingStatusHistoryInput,
  DeliveryTrackingEventRecord,
  DeliveryTrackingEventStream,
  DeliveryTrackingOrderRecord,
  DeliveryTrackingOrderStatus,
  DeliveryTrackingRepository,
  DeliveryTrackingStatusHistoryRecord,
  PersistDeliveryTrackingTransitionInput,
  DeliveryTrackingTransitionArtifacts,
} from "../domain/delivery-tracking.types";
import { AppError } from "../../../shared/errors/app-error";

type DeliveryTrackingOrderFindUniqueArgs = {
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

type DeliveryTrackingUserFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    telegramId: true;
  };
};

type DeliveryTrackingOrderUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    status: DeliveryTrackingOrderStatus;
  };
  select: {
    id: true;
    courierId: true;
    status: true;
    updatedAt: true;
    isDeleted: true;
  };
};

type DeliveryTrackingStatusHistoryCreateArgs = {
  data: CreateDeliveryTrackingStatusHistoryInput;
};

type DeliveryTrackingEventCreateArgs = {
  data: CreateDeliveryTrackingEventInput;
};

type DeliveryTrackingEventFindManyArgs = {
  where: {
    id: {
      gt: bigint;
    };
  };
  orderBy: {
    id: "asc";
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

type DeliveryTrackingEventPayloadRecord = {
  orderId: string;
  previousStatus?: string;
  oldStatus?: string;
  status?: string;
  newStatus?: string;
  changedByUserId?: string;
  changedByRole?: string;
  changedByName?: string;
  courierId?: string;
  assignedByUserId?: string;
  updatedAt: string;
};

type DeliveryTrackingPersistedEventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: DeliveryTrackingEventPayloadRecord;
  createdAt: Date;
};

export type DeliveryTrackingPrismaClientLike = {
  order: {
    findUnique(args: DeliveryTrackingOrderFindUniqueArgs): Promise<DeliveryTrackingOrderRecord | null>;
    update(args: DeliveryTrackingOrderUpdateArgs): Promise<DeliveryTrackingOrderRecord>;
  };
  orderStatusHistory: {
    create(args: DeliveryTrackingStatusHistoryCreateArgs): Promise<DeliveryTrackingStatusHistoryRecord>;
  };
  event: {
    create(args: DeliveryTrackingEventCreateArgs): Promise<DeliveryTrackingPersistedEventRecord>;
    findMany(args: DeliveryTrackingEventFindManyArgs): Promise<DeliveryTrackingPersistedEventRecord[]>;
  };
  user: {
    findUnique(args: DeliveryTrackingUserFindUniqueArgs): Promise<{ telegramId: string } | null>;
  };
};

type DeliveryTrackingPrismaTransactionalClientLike = DeliveryTrackingPrismaClientLike & {
  $transaction<T>(callback: (client: DeliveryTrackingPrismaClientLike) => Promise<T>): Promise<T>;
};

export type DeliveryTrackingPrismaProvider = {
  readonly client: DeliveryTrackingPrismaTransactionalClientLike;
};

const mapOrderStatus = (status: string): DeliveryTrackingOrderStatus => status as DeliveryTrackingOrderStatus;

const normalizeCursor = (cursor?: string): bigint => {
  if (cursor === undefined || cursor === "") {
    return 0n;
  }

  if (!/^\d+$/u.test(cursor)) {
    return 0n;
  }

  return BigInt(cursor);
};

const mapEventRecord = (event: DeliveryTrackingPersistedEventRecord): DeliveryTrackingEventRecord | null => {
  const status = event.payload.status ?? event.payload.newStatus;

  if (status === undefined) {
    return null;
  }

  const previousStatus = event.payload.previousStatus ?? event.payload.oldStatus;

  return {
    type: event.type as DeliveryTrackingEventRecord["type"],
    entity: event.entity as DeliveryTrackingEventRecord["entity"],
    entityId: event.entityId,
    payload: {
      orderId: event.payload.orderId,
      previousStatus: previousStatus === undefined ? undefined : mapOrderStatus(previousStatus),
      status: mapOrderStatus(status),
      changedByUserId: event.payload.changedByUserId,
      changedByRole: event.payload.changedByRole as DeliveryTrackingEventRecord["payload"]["changedByRole"],
      changedByName: event.payload.changedByName,
      courierId: event.payload.courierId,
      assignedByUserId: event.payload.assignedByUserId,
      updatedAt: event.payload.updatedAt,
    },
    revision: event.id.toString(),
    createdAt: event.createdAt.toISOString(),
  };
};

export class PrismaDeliveryTrackingRepository implements DeliveryTrackingRepository {
  constructor(private readonly prisma: DeliveryTrackingPrismaProvider) {}

  async findOrderById(orderId: string): Promise<DeliveryTrackingOrderRecord | null> {
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

  async findUserTelegramIdById(userId: string): Promise<string | null> {
    const user = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        telegramId: true,
      },
    });

    return user?.telegramId ?? null;
  }

  recordStatusTransition(
    input: PersistDeliveryTrackingTransitionInput,
  ): Promise<DeliveryTrackingTransitionArtifacts> {
    return this.prisma.client.$transaction(async (transactionClient) => {
      const currentOrder = await transactionClient.order.findUnique({
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

      if (currentOrder === null || currentOrder.isDeleted) {
        throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
          orderId: input.orderId,
        });
      }

      if (currentOrder.status !== input.oldStatus) {
        throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
          orderId: input.orderId,
          currentStatus: mapOrderStatus(currentOrder.status),
          nextStatus: input.newStatus,
          expectedStatus: input.oldStatus,
        });
      }

      const order = await transactionClient.order.update({
        where: {
          id: input.orderId,
        },
        data: {
          status: input.newStatus,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      const statusHistoryInput: CreateDeliveryTrackingStatusHistoryInput = {
        orderId: input.orderId,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
        changedByUserId: input.changedByUserId,
        changedAt: input.changedAt,
      };

      if (input.changedByRole !== undefined) {
        statusHistoryInput.changedByRole = input.changedByRole;
      }

      if (input.changedByName !== undefined) {
        statusHistoryInput.changedByName = input.changedByName;
      }

      const statusHistory = await transactionClient.orderStatusHistory.create({
        data: statusHistoryInput,
      });

      const statusEventPayload: CreateDeliveryTrackingEventInput["payload"] = {
        orderId: input.orderId,
        previousStatus: input.oldStatus,
        status: input.newStatus,
        changedByUserId: input.changedByUserId,
        updatedAt: order.updatedAt.toISOString(),
      };

      if (input.changedByRole !== undefined) {
        statusEventPayload.changedByRole = input.changedByRole;
      }

      if (input.changedByName !== undefined) {
        statusEventPayload.changedByName = input.changedByName;
      }

      const event = await transactionClient.event.create({
        data: {
          type: "order.status_changed",
          entity: "order",
          entityId: input.orderId,
          payload: statusEventPayload,
        },
      });

      return {
        order: {
          ...order,
          status: mapOrderStatus(order.status),
        },
        statusHistory,
        event: mapEventRecord(event)!,
        revision: event.id.toString(),
      };
    });
  }

  async listEventsSince(cursor?: string): Promise<DeliveryTrackingEventStream> {
    const normalizedCursor = normalizeCursor(cursor);
    const events = await this.prisma.client.event.findMany({
      where: {
        id: {
          gt: normalizedCursor,
        },
      },
      orderBy: {
        id: "asc",
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

    const mappedEvents = events.flatMap((event) => {
      const mappedEvent = mapEventRecord(event);

      return mappedEvent === null ? [] : [mappedEvent];
    });
    const lastEvent = mappedEvents[mappedEvents.length - 1];
    const nextCursor = lastEvent?.revision ?? cursor ?? "0";

    return {
      events: mappedEvents,
      nextCursor,
    };
  }
}
