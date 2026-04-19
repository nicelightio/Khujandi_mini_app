import type { PrismaProvider } from "../../../shared/db/prisma-client";
import type {
  CatalogMenuPage,
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  CatalogWriteResult,
  CreateProvisionedShopInput,
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  CreateSellerShopBindingInput,
  MenuPageId,
  ProductId,
  ProvisionedSellerShop,
  ProvisionSellerShopInput,
  ProvisioningTemplateBlueprint,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
  ShopId,
  UpdateSellerMenuPageInput,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../domain/catalog.types";
import { CatalogProvisioningWriter } from "./prisma/catalog-provisioning.writer";
import { CatalogPublicReader } from "./prisma/catalog-public.reader";
import { CatalogSellerReader } from "./prisma/catalog-seller.reader";
import { CatalogSellerWriter } from "./prisma/catalog-seller.writer";
import type { CatalogPrismaTransactionalClientLike } from "./prisma/catalog-prisma.types";

export class PrismaCatalogRepository implements CatalogRepository {
  private readonly publicReader: CatalogPublicReader;
  private readonly sellerReader: CatalogSellerReader;
  private readonly sellerWriter: CatalogSellerWriter;
  private readonly provisioningWriter: CatalogProvisioningWriter;

  constructor(private readonly prisma: PrismaProvider) {
    this.publicReader = new CatalogPublicReader(this.prisma.client);
    this.sellerReader = new CatalogSellerReader(this.prisma.client);
    this.sellerWriter = new CatalogSellerWriter(
      this.prisma.client as CatalogPrismaTransactionalClientLike,
    );
    this.provisioningWriter = new CatalogProvisioningWriter(this.prisma.client);
  }

  listPublicShops(): Promise<CatalogShop[]> {
    return this.publicReader.listPublicShops();
  }

  listPublicMenuPagesByShop(shopId: ShopId): Promise<CatalogMenuPage[]> {
    return this.publicReader.listPublicMenuPagesByShop(shopId);
  }

  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    return this.publicReader.listPublicProductsByShop(shopId);
  }

  listSellerBindingsByTelegramId(telegramId: string): Promise<SellerShopBinding[]> {
    return this.sellerReader.listSellerBindingsByTelegramId(telegramId);
  }

  listSellerMenuPagesByShop(shopId: ShopId): Promise<SellerCatalogMenuPage[]> {
    return this.sellerReader.listSellerMenuPagesByShop(shopId);
  }

  listSellerProductsByShop(shopId: ShopId): Promise<SellerCatalogProduct[]> {
    return this.sellerReader.listSellerProductsByShop(shopId);
  }

  findShopById(shopId: ShopId): Promise<SellerCatalogShop | null> {
    return this.sellerReader.findShopById(shopId);
  }

  createShop(input: CreateProvisionedShopInput): Promise<SellerCatalogShop> {
    return this.provisioningWriter.createShop(input);
  }

  updateShop(
    shopId: ShopId,
    input: UpdateSellerShopInput &
      Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">,
  ): Promise<CatalogWriteResult<SellerCatalogShop>> {
    return this.sellerWriter.updateShop(shopId, input);
  }

  findMenuPageById(menuPageId: MenuPageId): Promise<SellerCatalogMenuPage | null> {
    return this.sellerReader.findMenuPageById(menuPageId);
  }

  createMenuPage(
    input: CreateSellerMenuPageInput,
  ): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    return this.sellerWriter.createMenuPage(input);
  }

  updateMenuPage(
    menuPageId: MenuPageId,
    input: UpdateSellerMenuPageInput,
  ): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    return this.sellerWriter.updateMenuPage(menuPageId, input);
  }

  findProductById(productId: ProductId): Promise<SellerCatalogProduct | null> {
    return this.sellerReader.findProductById(productId);
  }

  createSellerShopBinding(input: CreateSellerShopBindingInput): Promise<SellerShopBinding> {
    return this.provisioningWriter.createSellerShopBinding(input);
  }

  provisionSellerShop(
    input: ProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint },
  ): Promise<ProvisionedSellerShop> {
    return this.provisioningWriter.provisionSellerShop(input);
  }

  createProduct(
    input: CreateSellerProductInput,
  ): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    return this.sellerWriter.createProduct(input);
  }

  updateProduct(
    productId: ProductId,
    input: UpdateSellerProductInput,
  ): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    return this.sellerWriter.updateProduct(productId, input);
  }
}
