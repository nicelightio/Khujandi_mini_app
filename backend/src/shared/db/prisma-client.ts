export type ShopStatusRecord = "WORKING" | "NOT_WORKING";

export type PublicShopRecord = {
  id: string;
  name: string;
};

export type PublicProductRecord = {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
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
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: ShopStatusRecord;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
  updatedAt?: Date;
};

export type EventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: unknown;
  createdAt: Date;
};

type ShopFindManyArgs = {
  where: {
    isDeleted: boolean;
    status?: ShopStatusRecord;
  };
  select: {
    id: true;
    name: true;
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
    description?: string | null;
    headerImageUrl?: string | null;
    backgroundImageUrl?: string | null;
    status: ShopStatusRecord;
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

export interface PrismaClientLike {
  shop: {
    findMany(args: ShopFindManyArgs): Promise<PublicShopRecord[]>;
    findUnique(args: ShopFindUniqueArgs): Promise<SellerShopRecord | null>;
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

export type PrismaProvider = {
  readonly client: PrismaClientLike;
};

export const createPrismaProvider = (client: PrismaClientLike): PrismaProvider => ({
  client,
});
