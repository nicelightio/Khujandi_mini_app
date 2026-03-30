import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createPrismaProvider } from "../../../backend/src/shared/db/prisma-client";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";

describe("catalog scaffold integration", () => {
  it("wires the catalog module with technical test helpers only", async () => {
    const prisma = createPrismaProvider({ shop: {}, product: {} });
    const context = createTestContext(prisma.client);
    const module = createCatalogModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getShops()).resolves.toEqual([]);
  });
});
