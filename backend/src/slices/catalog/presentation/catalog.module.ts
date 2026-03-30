import type { PrismaProvider } from "../../../shared/db/prisma-client";
import { CatalogService } from "../application/catalog.service";
import { PrismaCatalogRepository } from "../infrastructure/prisma-catalog.repository";
import { CatalogController } from "./catalog.controller";

export type CatalogModule = {
  controller: CatalogController;
  service: CatalogService;
  repository: PrismaCatalogRepository;
};

export const createCatalogModule = (prisma: PrismaProvider): CatalogModule => {
  const repository = new PrismaCatalogRepository(prisma);
  const service = new CatalogService(repository);
  const controller = new CatalogController(service);

  return {
    controller,
    service,
    repository,
  };
};
