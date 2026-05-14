import { AdminAccessService } from "../application/admin-access.service";
import type { AdminAccessPrismaProvider } from "../infrastructure/prisma-admin-access.repository";
import { PrismaAdminAccessRepository } from "../infrastructure/prisma-admin-access.repository";
import { AdminAccessController } from "./admin-access.controller";

export type AdminAccessModule = {
  controller: AdminAccessController;
  service: AdminAccessService;
  repository: PrismaAdminAccessRepository;
};

export const createAdminAccessModule = (prisma: AdminAccessPrismaProvider): AdminAccessModule => {
  const repository = new PrismaAdminAccessRepository(prisma);
  const service = new AdminAccessService(repository, repository);
  const controller = new AdminAccessController(service);

  return {
    controller,
    service,
    repository,
  };
};
