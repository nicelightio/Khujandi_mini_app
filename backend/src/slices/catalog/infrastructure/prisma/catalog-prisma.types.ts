import type { PrismaProvider } from "../../../../shared/db/prisma-client";

export type CatalogPrismaClientLike = PrismaProvider["client"];

export type CatalogPrismaTransactionalClientLike = CatalogPrismaClientLike & {
  $transaction<T>(callback: (client: CatalogPrismaClientLike) => Promise<T>): Promise<T>;
};
