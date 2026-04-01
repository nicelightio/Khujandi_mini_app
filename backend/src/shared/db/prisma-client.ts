export type PublicShopRecord = {
  id: string;
  name: string;
};

export type PublicProductRecord = {
  id: string;
  shopId: string;
  name: string;
  priceMinor: number;
};

export type SellerProductRecord = {
  id: string;
  shopId: string;
  name: string;
  priceMinor: number;
  isDeleted: boolean;
  shop: {
    sellerId: string;
    isDeleted: boolean;
  };
};

export type SellerShopRecord = {
  id: string;
  sellerId: string;
  name: string;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
};

type ShopFindManyArgs = {
  where: {
    isDeleted: boolean;
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
    renameCount: number;
    requiresManualRenameReview: boolean;
  };
  select: {
    id: true;
    sellerId: true;
    name: true;
    renameCount: true;
    requiresManualRenameReview: true;
    isDeleted: true;
  };
};

type ProductFindManyArgs = {
  where: {
    shopId: string;
    isDeleted: boolean;
    shop: {
      isDeleted: boolean;
    };
  };
  select: {
    id: true;
    shopId: true;
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
    name: true;
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
    name: string;
    priceMinor: number;
  };
  select: {
    id: true;
    shopId: true;
    name: true;
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
    name: string;
    priceMinor: number;
  };
  select: {
    id: true;
    shopId: true;
    name: true;
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

export interface PrismaClientLike {
  shop: {
    findMany(args: ShopFindManyArgs): Promise<PublicShopRecord[]>;
    findUnique(args: ShopFindUniqueArgs): Promise<SellerShopRecord | null>;
    update(args: ShopUpdateArgs): Promise<SellerShopRecord>;
  };
  product: {
    findMany(args: ProductFindManyArgs): Promise<PublicProductRecord[]>;
    findUnique(args: ProductFindUniqueArgs): Promise<SellerProductRecord | null>;
    create(args: ProductCreateArgs): Promise<SellerProductRecord>;
    update(args: ProductUpdateArgs): Promise<SellerProductRecord>;
  };
}

export type PrismaProvider = {
  readonly client: PrismaClientLike;
};

export const createPrismaProvider = (client: PrismaClientLike): PrismaProvider => ({
  client,
});
