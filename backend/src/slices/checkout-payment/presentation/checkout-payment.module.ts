import { CheckoutPaymentService } from "../application/checkout-payment.service";
import type { CheckoutPaymentRuntimeConfig } from "../application/checkout-payment.service";
import type { CheckoutPaymentPrismaProvider } from "../infrastructure/prisma-checkout-payment.repository";
import type { CheckoutPaymentCatalogCompositionReader } from "../domain/checkout-payment.types";
import { PrismaCheckoutPaymentRepository } from "../infrastructure/prisma-checkout-payment.repository";
import { CheckoutPaymentController } from "./checkout-payment.controller";

export type CheckoutPaymentModule = {
  controller: CheckoutPaymentController;
  service: CheckoutPaymentService;
  repository: PrismaCheckoutPaymentRepository;
};

export const createCheckoutPaymentModule = (
  prisma: CheckoutPaymentPrismaProvider,
  authConfig: CheckoutPaymentRuntimeConfig,
  catalogCompositionReader?: CheckoutPaymentCatalogCompositionReader,
): CheckoutPaymentModule => {
  const repository = new PrismaCheckoutPaymentRepository(prisma);
  const service = new CheckoutPaymentService(repository, authConfig, catalogCompositionReader);
  const controller = new CheckoutPaymentController(service);

  return {
    controller,
    service,
    repository,
  };
};
