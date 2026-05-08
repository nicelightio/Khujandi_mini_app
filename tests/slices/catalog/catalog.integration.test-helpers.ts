import { createPrismaProvider } from "../../../backend/src/shared/db/prisma-client";

export const createPrismaMock = () => {
  const shopFindMany = jest.fn().mockResolvedValue([]);
  const shopFindUnique = jest.fn().mockResolvedValue(null);
  const shopFindFirst = jest.fn().mockResolvedValue(null);
  const shopCreate = jest.fn();
  const shopUpdate = jest.fn();
  const menuPageFindMany = jest.fn().mockResolvedValue([]);
  const menuPageFindUnique = jest.fn().mockResolvedValue(null);
  const menuPageCreate = jest.fn();
  const menuPageUpdate = jest.fn();
  const productFindMany = jest.fn().mockResolvedValue([]);
  const productFindUnique = jest.fn().mockResolvedValue(null);
  const productCreate = jest.fn();
  const productUpdate = jest.fn();
  const showcaseProductFindMany = jest.fn().mockResolvedValue([]);
  const showcaseProductFindUnique = jest.fn().mockResolvedValue(null);
  const showcaseProductCount = jest.fn().mockResolvedValue(0);
  const showcaseProductCreate = jest.fn();
  const showcaseProductUpdate = jest.fn();
  const favoriteShopFindMany = jest.fn().mockResolvedValue([]);
  const favoriteShopFindUnique = jest.fn().mockResolvedValue(null);
  const favoriteShopCount = jest.fn().mockResolvedValue(0);
  const favoriteShopCreate = jest.fn();
  const favoriteShopUpdate = jest.fn();
  const eventCreate = jest.fn().mockResolvedValue({
    id: 1n,
    type: "catalog.event",
    entity: "shop",
    entityId: "entity-1",
    payload: {},
    createdAt: new Date("2026-04-10T10:00:00.000Z"),
  });
  const sellerShopBindingCreate = jest.fn();
  const sellerShopBindingFindMany = jest.fn().mockResolvedValue([]);
  const client = {
    shop: {
      findMany: shopFindMany,
      findUnique: shopFindUnique,
      findFirst: shopFindFirst,
      create: shopCreate,
      update: shopUpdate,
    },
    menuPage: {
      findMany: menuPageFindMany,
      findUnique: menuPageFindUnique,
      create: menuPageCreate,
      update: menuPageUpdate,
    },
    product: {
      findMany: productFindMany,
      findUnique: productFindUnique,
      create: productCreate,
      update: productUpdate,
    },
    catalogShowcaseProduct: {
      findMany: showcaseProductFindMany,
      findUnique: showcaseProductFindUnique,
      count: showcaseProductCount,
      create: showcaseProductCreate,
      update: showcaseProductUpdate,
    },
    catalogFavoriteShop: {
      findMany: favoriteShopFindMany,
      findUnique: favoriteShopFindUnique,
      count: favoriteShopCount,
      create: favoriteShopCreate,
      update: favoriteShopUpdate,
    },
    sellerShopBinding: {
      findMany: sellerShopBindingFindMany,
      create: sellerShopBindingCreate,
    },
    event: {
      create: eventCreate,
    },
  };
  const transaction = jest.fn(async (callback: (transactionClient: typeof client) => Promise<unknown>) => callback(client));

  const prisma = createPrismaProvider({
    ...client,
    $transaction: transaction,
  } as never);

  return {
    prisma,
    mocks: {
      shopFindMany,
      shopFindUnique,
      shopFindFirst,
      shopCreate,
      shopUpdate,
      menuPageFindMany,
      menuPageFindUnique,
      menuPageCreate,
      menuPageUpdate,
      productFindMany,
      productFindUnique,
      productCreate,
      productUpdate,
      showcaseProductFindMany,
      showcaseProductFindUnique,
      showcaseProductCount,
      showcaseProductCreate,
      showcaseProductUpdate,
      favoriteShopFindMany,
      favoriteShopFindUnique,
      favoriteShopCount,
      favoriteShopCreate,
      favoriteShopUpdate,
      eventCreate,
      sellerShopBindingCreate,
      sellerShopBindingFindMany,
      transaction,
    },
  };
};
