import { CatalogService } from "../application/catalog.service";
import { PrismaCatalogRepository } from "../infrastructure/prisma-catalog.repository";
import type { CatalogPrismaProvider } from "../infrastructure/prisma/catalog-prisma.types";
import { CatalogController } from "./catalog.controller";

export type CatalogModule = {
  controller: CatalogController;
  service: CatalogService;
  repository: PrismaCatalogRepository;
};

export const createCatalogModule = (prisma: CatalogPrismaProvider): CatalogModule => {
  const repository = new PrismaCatalogRepository(prisma);
  const service = new CatalogService(repository);
  const controller = new CatalogController(service);

  return {
    controller,
    service,
    repository,
  };
};
