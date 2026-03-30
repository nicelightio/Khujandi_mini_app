import type { PrismaProvider } from "../../../shared/db/prisma-client";
import type {
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  ShopId,
} from "../domain/catalog.types";

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaProvider) {}

  async listPublicShops(): Promise<CatalogShop[]> {
    void this.prisma;

    // Scaffold only: runtime query wiring lands in TASK-FT001-04.
    return [];
  }

  async listPublicProductsByShop(_shopId: ShopId): Promise<CatalogProduct[]> {
    void this.prisma;

    // Scaffold only: runtime query wiring lands in TASK-FT001-04.
    return [];
  }
}
