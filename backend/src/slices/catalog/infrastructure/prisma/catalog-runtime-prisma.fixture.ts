import { createPrismaProvider, type EventRecord } from "../../../../shared/db/prisma-client";
import type {
  CatalogFavoriteShopReference,
  CatalogShowcaseProductReference,
  CatalogWriteEvent,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
} from "../../domain/catalog.types";
import type {
  CatalogPrismaProvider,
  CatalogPrismaTransactionalClientLike,
} from "./catalog-prisma.types";

export type CatalogRuntimePrismaFixtureState = {
  shops: SellerCatalogShop[];
  menuPages: SellerCatalogMenuPage[];
  products: SellerCatalogProduct[];
  showcaseProducts: CatalogShowcaseProductReference[];
  favoriteShops: CatalogFavoriteShopReference[];
  bindings: SellerShopBinding[];
  events: CatalogWriteEvent[];
  nextShopId: number;
  nextMenuPageId: number;
  nextProductId: number;
  nextShowcaseProductId: number;
  nextFavoriteShopId: number;
  nextBindingId: number;
};

type RuntimeShopWhere = {
  isDeleted?: boolean;
  status?: "WORKING" | "NOT_WORKING";
  sellerId?: string;
  OR?: Array<{
    primaryPublicPath?: string;
    secondaryPublicPath?: string;
  }>;
};

type RuntimeShopSelect = {
  id?: boolean;
  name?: boolean;
  sellerId?: boolean;
  status?: boolean;
  primaryPublicPath?: boolean;
  secondaryPublicPath?: boolean;
  description?: boolean;
  headerImageUrl?: boolean;
  backgroundImageUrl?: boolean;
  renameCount?: boolean;
  requiresManualRenameReview?: boolean;
  isDeleted?: boolean;
  sellerBindings?: {
    select: {
      telegramId: boolean;
    };
  };
};

const createPrismaUniqueConstraintError = (message: string): Error => {
  const error = new Error(message);
  Object.assign(error, { code: "P2002" });
  return error;
};

const findShopOrThrow = (
  target: CatalogRuntimePrismaFixtureState,
  shopId: string,
): SellerCatalogShop => {
  const shop = target.shops.find((candidate) => candidate.id === shopId);

  if (shop === undefined) {
    throw new Error("Unknown shop id");
  }

  return shop;
};

const matchesShopWhere = (shop: SellerCatalogShop, where: RuntimeShopWhere): boolean =>
  (where.isDeleted === undefined || shop.isDeleted === where.isDeleted) &&
  (where.status === undefined || shop.status === where.status) &&
  (where.sellerId === undefined || shop.sellerId === where.sellerId) &&
  (where.OR === undefined ||
    where.OR.some(
      (condition) =>
        condition.primaryPublicPath === shop.primaryPublicPath ||
        condition.secondaryPublicPath === shop.secondaryPublicPath,
    ));

const projectShop = (
  target: CatalogRuntimePrismaFixtureState,
  shop: SellerCatalogShop,
  select?: RuntimeShopSelect,
) => ({
  ...(select?.id === true ? { id: shop.id } : {}),
  ...(select?.name === true ? { name: shop.name } : {}),
  ...(select?.sellerId === true ? { sellerId: shop.sellerId } : {}),
  ...(select?.status === true ? { status: shop.status } : {}),
  ...(select?.primaryPublicPath === true ? { primaryPublicPath: shop.primaryPublicPath } : {}),
  ...(select?.secondaryPublicPath === true ? { secondaryPublicPath: shop.secondaryPublicPath } : {}),
  ...(select?.description === true ? { description: shop.description } : {}),
  ...(select?.headerImageUrl === true ? { headerImageUrl: shop.headerImageUrl } : {}),
  ...(select?.backgroundImageUrl === true ? { backgroundImageUrl: shop.backgroundImageUrl } : {}),
  ...(select?.renameCount === true ? { renameCount: shop.renameCount } : {}),
  ...(select?.requiresManualRenameReview === true
    ? { requiresManualRenameReview: shop.requiresManualRenameReview }
    : {}),
  ...(select?.isDeleted === true ? { isDeleted: shop.isDeleted } : {}),
  ...(select?.sellerBindings !== undefined
    ? {
        sellerBindings: target.bindings
          .filter((binding) => binding.shopId === shop.id)
          .map((binding) => ({ telegramId: binding.telegramId })),
      }
    : {}),
});

const cloneCatalogFixtureState = (state: CatalogRuntimePrismaFixtureState): CatalogRuntimePrismaFixtureState => ({
  shops: state.shops.map((shop) => ({ ...shop })),
  menuPages: state.menuPages.map((page) => ({ ...page })),
  products: state.products.map((product) => ({ ...product })),
  showcaseProducts: (state.showcaseProducts ?? []).map((reference) => ({ ...reference })),
  favoriteShops: (state.favoriteShops ?? []).map((reference) => ({ ...reference })),
  bindings: state.bindings.map((binding) => ({ ...binding })),
  events: state.events.map((event) => ({
    ...event,
    payload: { ...event.payload },
  })),
  nextShopId: state.nextShopId,
  nextMenuPageId: state.nextMenuPageId,
  nextProductId: state.nextProductId,
  nextShowcaseProductId: state.nextShowcaseProductId ?? 1,
  nextFavoriteShopId: state.nextFavoriteShopId ?? 1,
  nextBindingId: state.nextBindingId,
});

export const createCatalogRuntimePrismaFixture = (
  state: CatalogRuntimePrismaFixtureState,
  options: {
    persist?: (state: CatalogRuntimePrismaFixtureState) => void;
  } = {},
): CatalogPrismaProvider => {
  const persistCommittedState = (target: CatalogRuntimePrismaFixtureState) => {
    if (target === state) {
      options.persist?.(state);
    }
  };

  const createEventRecord = (target: CatalogRuntimePrismaFixtureState, input: {
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
  }): EventRecord => {
    const createdAt = new Date();
    const eventRecord: EventRecord = {
      id: BigInt(target.events.length + 1),
      type: input.type,
      entity: input.entity,
      entityId: input.entityId,
      payload: { ...input.payload },
      createdAt,
    };

    target.events.push({
      type: eventRecord.type,
      entity: eventRecord.entity as CatalogWriteEvent["entity"],
      entityId: eventRecord.entityId,
      payload: { ...input.payload },
      createdAt: createdAt.toISOString(),
    });

    return eventRecord;
  };

  const createClient = (target: CatalogRuntimePrismaFixtureState) => ({
    shop: {
      findMany: async ({
        where,
        select,
      }: {
        where: RuntimeShopWhere;
        select?: RuntimeShopSelect;
      }) =>
        target.shops
          .filter((shop) => matchesShopWhere(shop, where))
          .map((shop) => projectShop(target, shop, select)),
      findFirst: async (args: {
        where: RuntimeShopWhere;
        select?: RuntimeShopSelect;
      }) => {
        const records = await createClient(target).shop.findMany(args);
        return records[0] ?? null;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.id) ?? null;
        return shop === null ? null : { ...shop };
      },
      create: async ({ data }: { data: { sellerId: string; name: string; primaryPublicPath: string; secondaryPublicPath: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status: "WORKING" | "NOT_WORKING" } }) => {
        if (target.shops.some((shop) => shop.sellerId === data.sellerId && shop.name === data.name)) {
          throw createPrismaUniqueConstraintError("Unique constraint failed");
        }

        if (
          target.shops.some(
            (shop) =>
              shop.primaryPublicPath === data.primaryPublicPath ||
              shop.secondaryPublicPath === data.primaryPublicPath ||
              shop.primaryPublicPath === data.secondaryPublicPath ||
              shop.secondaryPublicPath === data.secondaryPublicPath,
          )
        ) {
          throw createPrismaUniqueConstraintError("Unique constraint failed");
        }

        const shop: SellerCatalogShop = {
          id: `shop-runtime-${target.nextShopId++}`,
          sellerId: data.sellerId,
          name: data.name,
          primaryPublicPath: data.primaryPublicPath,
          secondaryPublicPath: data.secondaryPublicPath,
          description: data.description ?? null,
          headerImageUrl: data.headerImageUrl ?? null,
          backgroundImageUrl: data.backgroundImageUrl ?? null,
          status: data.status,
          renameCount: 0,
          requiresManualRenameReview: false,
          isDeleted: false,
        };
        target.shops.push(shop);
        persistCommittedState(target);
        return { ...shop };
      },
      update: async ({ where, data }: { where: { id: string }; data: { name: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status?: "WORKING" | "NOT_WORKING"; renameCount: number; requiresManualRenameReview: boolean } }) => {
        const shop = findShopOrThrow(target, where.id);

        if (
          target.shops.some(
            (candidate) =>
              candidate.id !== where.id && candidate.sellerId === shop.sellerId && candidate.name === data.name,
          )
        ) {
          throw createPrismaUniqueConstraintError("Unique constraint failed");
        }

        shop.name = data.name;
        if (data.description !== undefined) {
          shop.description = data.description;
        }
        if (data.headerImageUrl !== undefined) {
          shop.headerImageUrl = data.headerImageUrl;
        }
        if (data.backgroundImageUrl !== undefined) {
          shop.backgroundImageUrl = data.backgroundImageUrl;
        }
        shop.status = data.status ?? shop.status;
        shop.renameCount = data.renameCount;
        shop.requiresManualRenameReview = data.requiresManualRenameReview;
        persistCommittedState(target);

        return {
          ...shop,
          updatedAt: new Date(),
        };
      },
    },
    menuPage: {
      findMany: async ({
        where,
        select,
      }: {
        where: { shopId: string; shop: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } };
        select?: { shop?: { select: { sellerId: boolean; isDeleted?: boolean; status?: boolean } } };
      }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.shopId);

        if (
          shop === undefined ||
          shop.isDeleted !== where.shop.isDeleted ||
          (where.shop.status !== undefined && shop.status !== where.shop.status)
        ) {
          return [];
        }

        return target.menuPages
          .filter((page) => page.shopId === where.shopId)
          .sort((left, right) => left.position - right.position)
          .map((page) => {
            if (select?.shop !== undefined) {
              return {
                id: page.id,
                shopId: page.shopId,
                name: page.name,
                position: page.position,
                shop: {
                  sellerId: shop.sellerId,
                  isDeleted: shop.isDeleted,
                  status: shop.status,
                },
              };
            }

            return {
              id: page.id,
              shopId: page.shopId,
              name: page.name,
              position: page.position,
            };
          });
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const page = target.menuPages.find((candidate) => candidate.id === where.id) ?? null;

        if (page === null) {
          return null;
        }

        const shop = target.shops.find((candidate) => candidate.id === page.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        return {
          ...page,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
        };
      },
      create: async ({ data }: { data: { shopId: string; name: string; position: number } }) => {
        const shop = findShopOrThrow(target, data.shopId);

        const page: SellerCatalogMenuPage = {
          id: `menu-page-runtime-${target.nextMenuPageId++}`,
          shopId: data.shopId,
          name: data.name,
          position: data.position,
          sellerId: shop.sellerId,
          shopStatus: shop.status,
        };
        target.menuPages.push(page);
        persistCommittedState(target);

        return {
          id: page.id,
          shopId: page.shopId,
          name: page.name,
          position: page.position,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: { shopId: string; name: string } }) => {
        const page = target.menuPages.find((candidate) => candidate.id === where.id);

        if (page === undefined) {
          throw new Error("Unknown menu page id");
        }

        const shop = findShopOrThrow(target, data.shopId);

        page.shopId = data.shopId;
        page.name = data.name;
        page.sellerId = shop.sellerId;
        page.shopStatus = shop.status;
        persistCommittedState(target);

        return {
          id: page.id,
          shopId: page.shopId,
          name: page.name,
          position: page.position,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
          updatedAt: new Date(),
        };
      },
    },
    product: {
      findMany: async ({
        where,
        select,
      }: {
        where: { shopId: string; isDeleted: boolean; shop: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } };
        select?: {
          id?: boolean;
          shopId?: boolean;
          menuPageId?: boolean;
          name?: boolean;
          description?: boolean;
          imageUrl?: boolean;
          priceMinor?: boolean;
          isDeleted?: boolean;
          shop?: { select: { sellerId: boolean; isDeleted?: boolean } };
        };
      }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.shopId);

        if (
          shop === undefined ||
          shop.isDeleted !== where.shop.isDeleted ||
          (where.shop.status !== undefined && shop.status !== where.shop.status)
        ) {
          return [];
        }

        return target.products
          .filter((product) => product.shopId === where.shopId && product.isDeleted === where.isDeleted)
          .map((product) => ({
            ...(select?.id === true ? { id: product.id } : {}),
            ...(select?.shopId === true ? { shopId: product.shopId } : {}),
            ...(select?.menuPageId === true ? { menuPageId: product.menuPageId } : {}),
            ...(select?.name === true ? { name: product.name } : {}),
            ...(select?.description === true ? { description: product.description } : {}),
            ...(select?.imageUrl === true ? { imageUrl: product.imageUrl } : {}),
            ...(select?.priceMinor === true ? { priceMinor: product.priceMinor } : {}),
            ...(select?.isDeleted === true ? { isDeleted: product.isDeleted } : {}),
            ...(select?.shop !== undefined
              ? {
                  shop: {
                    sellerId: shop.sellerId,
                    ...(select.shop.select.isDeleted === true ? { isDeleted: shop.isDeleted } : {}),
                  },
                }
              : {}),
          }));
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const product = target.products.find((candidate) => candidate.id === where.id) ?? null;

        if (product === null) {
          return null;
        }

        const shop = target.shops.find((candidate) => candidate.id === product.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
        };
      },
      create: async ({ data }: { data: { shopId: string; menuPageId?: string | null; name: string; description?: string | null; imageUrl?: string | null; priceMinor: number } }) => {
        const shop = findShopOrThrow(target, data.shopId);

        const product: SellerCatalogProduct = {
          id: `product-runtime-${target.nextProductId++}`,
          shopId: data.shopId,
          menuPageId: data.menuPageId ?? null,
          name: data.name,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          priceMinor: data.priceMinor,
          isDeleted: false,
          sellerId: shop.sellerId,
        };
        target.products.push(product);
        persistCommittedState(target);

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: { shopId: string; menuPageId?: string | null; name: string; description?: string | null; imageUrl?: string | null; priceMinor: number } }) => {
        const product = target.products.find((candidate) => candidate.id === where.id);

        if (product === undefined) {
          throw new Error("Unknown product id");
        }

        const shop = findShopOrThrow(target, data.shopId);

        product.shopId = data.shopId;
        product.menuPageId = data.menuPageId ?? null;
        product.name = data.name;
        product.description = data.description ?? null;
        product.imageUrl = data.imageUrl ?? null;
        product.priceMinor = data.priceMinor;
        product.sellerId = shop.sellerId;
        persistCommittedState(target);

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
          updatedAt: new Date(),
        };
      },
    },
    catalogShowcaseProduct: {
      findMany: async ({ where, orderBy, take, select }: { where?: { isActive?: boolean }; orderBy?: Array<Record<string, "asc" | "desc">> | Record<string, "asc" | "desc">; take?: number; select?: Record<string, unknown> }) => {
        let references = (target.showcaseProducts ?? []).filter(
          (reference) => where?.isActive === undefined || reference.isActive === where.isActive,
        );

        const orderRules = Array.isArray(orderBy) ? orderBy : orderBy === undefined ? [] : [orderBy];
        references = [...references].sort((left, right) => {
          for (const rule of orderRules) {
            const [field, direction] = Object.entries(rule)[0] ?? [];
            if (field === "sortOrder" && left.sortOrder !== right.sortOrder) {
              return direction === "desc" ? right.sortOrder - left.sortOrder : left.sortOrder - right.sortOrder;
            }
          }

          return 0;
        });

        return references.slice(0, take ?? references.length).map((reference) => {
          const product = target.products.find((candidate) => candidate.id === reference.productId);
          const shop = product === undefined ? undefined : target.shops.find((candidate) => candidate.id === product.shopId);

          return {
            ...reference,
            ...(select?.product !== undefined && product !== undefined && shop !== undefined
              ? {
                  product: {
                    id: product.id,
                    shopId: product.shopId,
                    menuPageId: product.menuPageId,
                    name: product.name,
                    description: product.description,
                    imageUrl: product.imageUrl,
                    priceMinor: product.priceMinor,
                    isDeleted: product.isDeleted,
                    shop: {
                      id: shop.id,
                      name: shop.name,
                      primaryPublicPath: shop.primaryPublicPath,
                      secondaryPublicPath: shop.secondaryPublicPath,
                      isDeleted: shop.isDeleted,
                      status: shop.status,
                    },
                  },
                }
              : {}),
          };
        });
      },
      findUnique: async ({ where }: { where: { productId: string } }) =>
        (target.showcaseProducts ?? []).find((reference) => reference.productId === where.productId) ?? null,
      count: async ({ where }: { where?: { isActive?: boolean } }) =>
        (target.showcaseProducts ?? []).filter(
          (reference) => where?.isActive === undefined || reference.isActive === where.isActive,
        ).length,
      create: async ({ data }: { data: { productId: string; sortOrder: number; isActive: boolean } }) => {
        const reference: CatalogShowcaseProductReference = {
          id: `showcase-product-runtime-${target.nextShowcaseProductId++}`,
          productId: data.productId,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        target.showcaseProducts.push(reference);
        persistCommittedState(target);
        return { ...reference };
      },
      update: async ({ where, data }: { where: { productId: string }; data: { sortOrder?: number; isActive?: boolean } }) => {
        const reference = target.showcaseProducts.find((candidate) => candidate.productId === where.productId);

        if (reference === undefined) {
          throw new Error("Unknown showcase product reference");
        }

        reference.sortOrder = data.sortOrder ?? reference.sortOrder;
        reference.isActive = data.isActive ?? reference.isActive;
        persistCommittedState(target);
        return { ...reference };
      },
    },
    catalogFavoriteShop: {
      findMany: async ({ where, orderBy, take, select }: { where?: { isActive?: boolean }; orderBy?: Array<Record<string, "asc" | "desc">> | Record<string, "asc" | "desc">; take?: number; select?: Record<string, unknown> }) => {
        let references = (target.favoriteShops ?? []).filter(
          (reference) => where?.isActive === undefined || reference.isActive === where.isActive,
        );

        const orderRules = Array.isArray(orderBy) ? orderBy : orderBy === undefined ? [] : [orderBy];
        references = [...references].sort((left, right) => {
          for (const rule of orderRules) {
            const [field, direction] = Object.entries(rule)[0] ?? [];
            if (field === "sortOrder" && left.sortOrder !== right.sortOrder) {
              return direction === "desc" ? right.sortOrder - left.sortOrder : left.sortOrder - right.sortOrder;
            }
          }

          return 0;
        });

        return references.slice(0, take ?? references.length).map((reference) => {
          const shop = target.shops.find((candidate) => candidate.id === reference.shopId);

          return {
            ...reference,
            ...(select?.shop !== undefined && shop !== undefined
              ? {
                  shop: {
                    id: shop.id,
                    name: shop.name,
                    primaryPublicPath: shop.primaryPublicPath,
                    secondaryPublicPath: shop.secondaryPublicPath,
                    description: shop.description,
                    headerImageUrl: shop.headerImageUrl,
                    backgroundImageUrl: shop.backgroundImageUrl,
                    status: shop.status,
                    isDeleted: shop.isDeleted,
                  },
                }
              : {}),
          };
        });
      },
      findUnique: async ({ where }: { where: { shopId: string } }) =>
        (target.favoriteShops ?? []).find((reference) => reference.shopId === where.shopId) ?? null,
      count: async ({ where }: { where?: { isActive?: boolean; shop?: { isDeleted?: boolean; status?: "WORKING" | "NOT_WORKING" } } }) =>
        (target.favoriteShops ?? []).filter((reference) => {
          if (where?.isActive !== undefined && reference.isActive !== where.isActive) {
            return false;
          }

          if (where?.shop === undefined) {
            return true;
          }

          const shop = target.shops.find((candidate) => candidate.id === reference.shopId);

          if (shop === undefined) {
            return false;
          }

          if (where.shop.isDeleted !== undefined && shop.isDeleted !== where.shop.isDeleted) {
            return false;
          }

          return where.shop.status === undefined || shop.status === where.shop.status;
        }).length,
      create: async ({ data }: { data: { shopId: string; sortOrder: number; isActive: boolean } }) => {
        const reference: CatalogFavoriteShopReference = {
          id: `favorite-shop-runtime-${target.nextFavoriteShopId++}`,
          shopId: data.shopId,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        };
        target.favoriteShops.push(reference);
        persistCommittedState(target);
        return { ...reference };
      },
      update: async ({ where, data }: { where: { shopId: string }; data: { sortOrder?: number; isActive?: boolean } }) => {
        const reference = target.favoriteShops.find((candidate) => candidate.shopId === where.shopId);

        if (reference === undefined) {
          throw new Error("Unknown favorite shop reference");
        }

        reference.sortOrder = data.sortOrder ?? reference.sortOrder;
        reference.isActive = data.isActive ?? reference.isActive;
        persistCommittedState(target);
        return { ...reference };
      },
    },
    sellerShopBinding: {
      findMany: async ({ where }: { where: { telegramId: string } }) =>
        target.bindings
          .filter((binding) => binding.telegramId === where.telegramId)
          .map((binding) => ({ ...binding })),
      create: async ({ data }: { data: { shopId: string; sellerId: string; telegramId: string } }) => {
        if (target.bindings.some((binding) => binding.shopId === data.shopId)) {
          throw createPrismaUniqueConstraintError("duplicate binding");
        }

        const binding: SellerShopBinding = {
          id: `binding-runtime-${target.nextBindingId++}`,
          shopId: data.shopId,
          sellerId: data.sellerId,
          telegramId: data.telegramId,
        };
        target.bindings.push(binding);
        persistCommittedState(target);
        return { ...binding };
      },
    },
    event: {
      create: async ({ data }: { data: { type: string; entity: string; entityId: string; payload: Record<string, unknown> } }) => {
        const event = createEventRecord(target, data);
        persistCommittedState(target);
        return event;
      },
    },
  });

  const client = createClient(state) as ReturnType<typeof createClient> & {
    $transaction<T>(callback: (transactionClient: ReturnType<typeof createClient>) => Promise<T>): Promise<T>;
  };

  client.$transaction = async (callback) => {
    const draftState = cloneCatalogFixtureState(state);
    const result = await callback(createClient(draftState));
    Object.assign(state, draftState);
    options.persist?.(state);
    return result;
  };

  return createPrismaProvider(client as CatalogPrismaTransactionalClientLike);
};
