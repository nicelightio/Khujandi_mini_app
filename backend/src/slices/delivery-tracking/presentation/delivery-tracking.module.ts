import { DeliveryTrackingService } from "../application/delivery-tracking.service";
import type { DeliveryTrackingPrismaProvider } from "../infrastructure/prisma-delivery-tracking.repository";
import { PrismaDeliveryTrackingRepository } from "../infrastructure/prisma-delivery-tracking.repository";
import { DeliveryTrackingController } from "./delivery-tracking.controller";

export type DeliveryTrackingModule = {
  controller: DeliveryTrackingController;
  service: DeliveryTrackingService;
  repository: PrismaDeliveryTrackingRepository;
};

export const createDeliveryTrackingModule = (
  prisma: DeliveryTrackingPrismaProvider,
): DeliveryTrackingModule => {
  const repository = new PrismaDeliveryTrackingRepository(prisma);
  const service = new DeliveryTrackingService(repository);
  const controller = new DeliveryTrackingController(service);

  return {
    controller,
    service,
    repository,
  };
};
