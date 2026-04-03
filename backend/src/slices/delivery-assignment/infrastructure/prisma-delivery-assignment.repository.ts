import type {
  CreateDeliveryAssignmentAuditInput,
  CreateDeliveryAssignmentEventInput,
  CreateDeliveryAssignmentStatusHistoryInput,
  DeliveryAssignmentArtifactsRecord,
  DeliveryAssignmentAuditRecord,
  DeliveryAssignmentCourierRecord,
  DeliveryAssignmentOrderRecord,
  DeliveryAssignmentOrderStatus,
  DeliveryAssignmentRepository,
  DeliveryAssignmentUserRole,
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
    name: true;
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

type DeliveryAssignmentAuditCreateArgs = {
  data: CreateDeliveryAssignmentAuditInput;
};

type DeliveryAssignmentEventCreateArgs = {
  data: CreateDeliveryAssignmentEventInput;
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
  };
  user: {
    findUnique(args: DeliveryAssignmentCourierFindUniqueArgs): Promise<DeliveryAssignmentCourierRecord | null>;
  };
  orderStatusHistory: {
    create(args: DeliveryAssignmentStatusHistoryCreateArgs): Promise<DeliveryAssignmentStatusHistoryRecord>;
  };
  deliveryAssignmentAudit: {
    create(args: DeliveryAssignmentAuditCreateArgs): Promise<DeliveryAssignmentAuditRecord>;
  };
  event: {
    create(args: DeliveryAssignmentEventCreateArgs): Promise<DeliveryAssignmentEventRecord>;
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
      select: {
        id: true,
        telegramId: true,
        role: true,
        isActive: true,
        name: true,
      },
    });

    if (courier === null) {
      return null;
    }

    return {
      ...courier,
      role: mapUserRole(courier.role),
    };
  }

  assignCourier(
    input: PersistDeliveryAssignmentInput,
  ): Promise<DeliveryAssignmentArtifactsRecord> {
    return this.prisma.client.$transaction(async (transactionClient) => {
      const order = await transactionClient.order.update({
        where: {
          id: input.orderId,
        },
        data: {
          courierId: input.courierId,
          status: "ASSIGNED",
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

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
        action: "assigned" as const,
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
}
