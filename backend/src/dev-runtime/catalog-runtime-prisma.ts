// Dev runtime is only a compatibility adapter; the Prisma-like catalog fixture is owned by the catalog slice.
export {
  createCatalogRuntimePrismaFixture as createInMemoryCatalogPrisma,
  type CatalogRuntimePrismaFixtureState,
} from "../slices/catalog/infrastructure/prisma/catalog-runtime-prisma.fixture";
