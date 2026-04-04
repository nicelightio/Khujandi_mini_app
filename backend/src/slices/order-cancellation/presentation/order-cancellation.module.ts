import { OrderCancellationService } from "../application/order-cancellation.service";
import type { OrderCancellationPrismaProvider } from "../infrastructure/prisma-order-cancellation.repository";
import { PrismaOrderCancellationRepository } from "../infrastructure/prisma-order-cancellation.repository";
import { OrderCancellationController } from "./order-cancellation.controller";

export type OrderCancellationModule = {
  controller: OrderCancellationController;
  service: OrderCancellationService;
  repository: PrismaOrderCancellationRepository;
};

export const createOrderCancellationModule = (
  prisma: OrderCancellationPrismaProvider,
): OrderCancellationModule => {
  const repository = new PrismaOrderCancellationRepository(prisma);
  const service = new OrderCancellationService(repository);
  const controller = new OrderCancellationController(service);

  return {
    controller,
    service,
    repository,
  };
};
