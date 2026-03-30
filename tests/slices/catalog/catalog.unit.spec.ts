import { CatalogService } from "../../../backend/src/slices/catalog/application/catalog.service";
import type { CatalogRepository } from "../../../backend/src/slices/catalog/domain/catalog.types";

const createRepository = (): CatalogRepository => ({
  listPublicShops: async () => [],
  listPublicProductsByShop: async () => [],
});

describe("catalog service scaffold", () => {
  it("keeps public browse behavior behind the owning repository boundary", async () => {
    const service = new CatalogService(createRepository());

    await expect(service.listPublicShops()).resolves.toEqual([]);
    await expect(service.listPublicProductsByShop("shop-1")).resolves.toEqual([]);
  });
});
