import type { EventRecord, PrismaProvider } from "../../../../shared/db/prisma-client";

export type ShopStatusRecord = "WORKING" | "NOT_WORKING";

export type PublicProductRecord = {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceMinor: number;
};

export type PublicMenuPageRecord = {
  id: string;
  shopId: string;
  name: string;
  position: number;
};

export type SellerShopBindingRecord = {
  id: string;
  shopId: string;
  sellerId: string;
  telegramId: string;
};

export type SellerProductRecord = {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  isDeleted: boolean;
  shop: {
    sellerId: string;
    isDeleted: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type SellerMenuPageRecord = {
  id: string;
  shopId: string;
  name: string;
  position: number;
  shop: {
    sellerId: string;
    isDeleted: boolean;
    status: ShopStatusRecord;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type SellerShopRecord = {
  id: string;
  sellerId: string;
  name: string;
  primaryPublicPath: string;
  secondaryPublicPath: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: ShopStatusRecord;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
  updatedAt?: Date;
};

export type ShowcaseProductReferenceRecord = {
  id: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  product?: {
    id: string;
    shopId: string;
    menuPageId: string | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceMinor: number;
    isDeleted: boolean;
    shop: {
      id: string;
      name: string;
      primaryPublicPath: string;
      secondaryPublicPath: string;
      isDeleted: boolean;
      status: ShopStatusRecord;
    };
  };
};

export type FavoriteShopReferenceRecord = {
  id: string;
  shopId: string;
  sortOrder: number;
  isActive: boolean;
  shop?: {
    id: string;
    name: string;
    primaryPublicPath: string;
    secondaryPublicPath: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    status: ShopStatusRecord;
    isDeleted: boolean;
  };
};

type ShopFindManyArgs = {
  where: {
    isDeleted?: boolean;
    status?: ShopStatusRecord;
    sellerId?: string;
    OR?: Array<{
      primaryPublicPath?: string;
      secondaryPublicPath?: string;
    }>;
  };
  select: {
    id?: true;
    name?: true;
    sellerId?: true;
    status?: true;
    primaryPublicPath?: true;
    secondaryPublicPath?: true;
    description?: true;
    headerImageUrl?: true;
    backgroundImageUrl?: true;
    renameCount?: true;
    requiresManualRenameReview?: true;
    isDeleted?: true;
    sellerBindings?: {
      select: {
        telegramId: true;
      };
    };
  };
};

type ShopFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    sellerId: true;
    name: true;
    primaryPublicPath: true;
    secondaryPublicPath: true;
    description: true;
    headerImageUrl: true;
    backgroundImageUrl: true;
    status: true;
    renameCount: true;
    requiresManualRenameReview: true;
    isDeleted: true;
  };
};

type ShopCreateArgs = {
  data: {
    sellerId: string;
    name: string;
    primaryPublicPath: string;
    secondaryPublicPath: string;
    description?: string | null;
    headerImageUrl?: string | null;
    backgroundImageUrl?: string | null;
    status: ShopStatusRecord;
  };
  select: {
    id: true;
    sellerId: true;
    name: true;
    primaryPublicPath: true;
    secondaryPublicPath: true;
    description: true;
    headerImageUrl: true;
    backgroundImageUrl: true;
    status: true;
    renameCount: true;
    requiresManualRenameReview: true;
    isDeleted: true;
  };
};

type ShopUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    name: string;
    description?: string | null;
    headerImageUrl?: string | null;
    backgroundImageUrl?: string | null;
    status?: ShopStatusRecord;
    renameCount: number;
    requiresManualRenameReview: boolean;
  };
  select: {
    id: true;
    sellerId: true;
    name: true;
    description: true;
    headerImageUrl: true;
    backgroundImageUrl: true;
    status: true;
    renameCount: true;
    requiresManualRenameReview: true;
    isDeleted: true;
  };
};

type MenuPageFindManyArgs = {
  where: {
    shopId: string;
    shop: {
      isDeleted: boolean;
      status?: ShopStatusRecord;
    };
  };
  orderBy: {
    position: "asc" | "desc";
  };
  select: {
    id: true;
    shopId: true;
    name: true;
    position: true;
  };
};

type MenuPageFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    shopId: true;
    name: true;
    position: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
        status: true;
      };
    };
  };
};

type MenuPageCreateArgs = {
  data: {
    shopId: string;
    name: string;
    position: number;
  };
  select: {
    id: true;
    shopId: true;
    name: true;
    position: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
        status: true;
      };
    };
  };
};

type MenuPageUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    shopId: string;
    name: string;
  };
  select: {
    id: true;
    shopId: true;
    name: true;
    position: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
        status: true;
      };
    };
  };
};

type ProductFindManyArgs = {
  where: {
    shopId: string;
    isDeleted: boolean;
    shop: {
      isDeleted: boolean;
      status?: ShopStatusRecord;
    };
  };
  select: {
    id: true;
    shopId: true;
    menuPageId: true;
    name: true;
    description?: true;
    imageUrl?: true;
    priceMinor: true;
  };
};

type ProductFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    shopId: true;
    menuPageId: true;
    name: true;
    description: true;
    imageUrl: true;
    priceMinor: true;
    isDeleted: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
      };
    };
  };
};

type ProductCreateArgs = {
  data: {
    shopId: string;
    menuPageId?: string | null;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    priceMinor: number;
  };
  select: {
    id: true;
    shopId: true;
    menuPageId: true;
    name: true;
    description: true;
    imageUrl: true;
    priceMinor: true;
    isDeleted: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
      };
    };
  };
};

type ProductUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    shopId: string;
    menuPageId?: string | null;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    priceMinor: number;
  };
  select: {
    id: true;
    shopId: true;
    menuPageId: true;
    name: true;
    description: true;
    imageUrl: true;
    priceMinor: true;
    isDeleted: true;
    shop: {
      select: {
        sellerId: true;
        isDeleted: true;
      };
    };
  };
};

type SellerShopBindingCreateArgs = {
  data: {
    shopId: string;
    sellerId: string;
    telegramId: string;
  };
  select: {
    id: true;
    shopId: true;
    sellerId: true;
    telegramId: true;
  };
};

type SellerShopBindingFindManyArgs = {
  where: {
    telegramId: string;
  };
  select: {
    id: true;
    shopId: true;
    sellerId: true;
    telegramId: true;
  };
};

export interface CatalogPrismaClientLike {
  shop: {
    findMany(args: ShopFindManyArgs): Promise<Array<Record<string, unknown>>>;
    findUnique(args: ShopFindUniqueArgs): Promise<SellerShopRecord | null>;
    findFirst(args: ShopFindManyArgs): Promise<Record<string, unknown> | null>;
    create(args: ShopCreateArgs): Promise<SellerShopRecord>;
    update(args: ShopUpdateArgs): Promise<SellerShopRecord>;
  };
  menuPage: {
    findMany(args: MenuPageFindManyArgs): Promise<PublicMenuPageRecord[]>;
    findUnique(args: MenuPageFindUniqueArgs): Promise<SellerMenuPageRecord | null>;
    create(args: MenuPageCreateArgs): Promise<SellerMenuPageRecord>;
    update(args: MenuPageUpdateArgs): Promise<SellerMenuPageRecord>;
  };
  product: {
    findMany(args: ProductFindManyArgs): Promise<PublicProductRecord[]>;
    findUnique(args: ProductFindUniqueArgs): Promise<SellerProductRecord | null>;
    create(args: ProductCreateArgs): Promise<SellerProductRecord>;
    update(args: ProductUpdateArgs): Promise<SellerProductRecord>;
  };
  catalogShowcaseProduct: {
    findMany(args: Record<string, unknown>): Promise<ShowcaseProductReferenceRecord[]>;
    findUnique(args: Record<string, unknown>): Promise<ShowcaseProductReferenceRecord | null>;
    count(args: Record<string, unknown>): Promise<number>;
    create(args: Record<string, unknown>): Promise<ShowcaseProductReferenceRecord>;
    update(args: Record<string, unknown>): Promise<ShowcaseProductReferenceRecord>;
  };
  catalogFavoriteShop: {
    findMany(args: Record<string, unknown>): Promise<FavoriteShopReferenceRecord[]>;
    findUnique(args: Record<string, unknown>): Promise<FavoriteShopReferenceRecord | null>;
    count(args: Record<string, unknown>): Promise<number>;
    create(args: Record<string, unknown>): Promise<FavoriteShopReferenceRecord>;
    update(args: Record<string, unknown>): Promise<FavoriteShopReferenceRecord>;
  };
  sellerShopBinding: {
    findMany(args: SellerShopBindingFindManyArgs): Promise<SellerShopBindingRecord[]>;
    create(args: SellerShopBindingCreateArgs): Promise<SellerShopBindingRecord>;
  };
  event: {
    create(args: {
      data: {
        type: string;
        entity: string;
        entityId: string;
        payload: Record<string, unknown>;
      };
    }): Promise<EventRecord>;
  };
}

export type CatalogPrismaProvider = PrismaProvider<CatalogPrismaClientLike>;

export type CatalogPrismaTransactionalClientLike = CatalogPrismaClientLike & {
  $transaction<T>(callback: (client: CatalogPrismaClientLike) => Promise<T>): Promise<T>;
};
