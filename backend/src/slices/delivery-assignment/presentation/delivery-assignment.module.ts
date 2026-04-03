import type { DeliveryAssignmentNotifier } from "../domain/delivery-assignment.types";
import { DeliveryAssignmentService } from "../application/delivery-assignment.service";
import type { DeliveryAssignmentPrismaProvider } from "../infrastructure/prisma-delivery-assignment.repository";
import { PrismaDeliveryAssignmentRepository } from "../infrastructure/prisma-delivery-assignment.repository";
import { DeliveryAssignmentController } from "./delivery-assignment.controller";

export type DeliveryAssignmentModule = {
  controller: DeliveryAssignmentController;
  service: DeliveryAssignmentService;
  repository: PrismaDeliveryAssignmentRepository;
};

export const createDeliveryAssignmentModule = (
  prisma: DeliveryAssignmentPrismaProvider,
  notifier?: DeliveryAssignmentNotifier,
): DeliveryAssignmentModule => {
  const repository = new PrismaDeliveryAssignmentRepository(prisma);
  const service = new DeliveryAssignmentService(repository, notifier);
  const controller = new DeliveryAssignmentController(service);

  return {
    controller,
    service,
    repository,
  };
};
