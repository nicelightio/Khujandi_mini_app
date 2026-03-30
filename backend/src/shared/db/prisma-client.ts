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

type ShopFindManyArgs = {
  where: {
    isDeleted: boolean;
  };
  select: {
    id: true;
    name: true;
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

export interface PrismaClientLike {
  shop: {
    findMany(args: ShopFindManyArgs): Promise<PublicShopRecord[]>;
  };
  product: {
    findMany(args: ProductFindManyArgs): Promise<PublicProductRecord[]>;
  };
}

export type PrismaProvider = {
  readonly client: PrismaClientLike;
};

export const createPrismaProvider = (client: PrismaClientLike): PrismaProvider => ({
  client,
});
