import type { OrderCancellationPrismaProvider } from "../../../backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository";

type OrderCancellationPrismaClient = {
  order: {
    findUnique: OrderCancellationPrismaProvider["client"]["order"]["findUnique"];
    update: OrderCancellationPrismaProvider["client"]["order"]["update"];
    updateMany?: OrderCancellationPrismaProvider["client"]["order"]["updateMany"];
  };
  orderStatusHistory: OrderCancellationPrismaProvider["client"]["orderStatusHistory"];
  orderCancellationAudit: OrderCancellationPrismaProvider["client"]["orderCancellationAudit"];
  event: OrderCancellationPrismaProvider["client"]["event"];
};

export const createPrismaProvider = (
  client: OrderCancellationPrismaClient,
): OrderCancellationPrismaProvider => {
  const normalizedClient: OrderCancellationPrismaProvider["client"] = {
    ...client,
    order: {
      ...client.order,
      updateMany: client.order.updateMany ?? jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: async (callback) => callback(normalizedClient),
  };

  return {
    client: normalizedClient,
  };
};
