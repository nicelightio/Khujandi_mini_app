import { createPrismaProvider, type EventRecord } from "../shared/db/prisma-client";
import type {
  CatalogWriteEvent,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
} from "../slices/catalog/domain/catalog.types";
import { cloneCatalogState, type CatalogRuntimeState } from "./catalog-runtime-state";

export const createInMemoryCatalogPrisma = (
  state: CatalogRuntimeState,
  options: {
    persist?: (state: CatalogRuntimeState) => void;
  } = {},
) => {
  const persistCommittedState = (target: CatalogRuntimeState) => {
    if (target === state) {
      options.persist?.(state);
    }
  };

  const createEventRecord = (target: CatalogRuntimeState, input: {
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

  const createClient = (target: CatalogRuntimeState) => ({
    shop: {
      findMany: async ({
        where,
        select,
      }: {
        where: {
          isDeleted?: boolean;
          status?: "WORKING" | "NOT_WORKING";
          sellerId?: string;
          OR?: Array<{
            primaryPublicPath?: string;
            secondaryPublicPath?: string;
          }>;
        };
        select?: {
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
      }) =>
        target.shops
          .filter((shop) => where.isDeleted === undefined || shop.isDeleted === where.isDeleted)
          .filter((shop) => where.status === undefined || shop.status === where.status)
          .filter((shop) => where.sellerId === undefined || shop.sellerId === where.sellerId)
          .filter(
            (shop) =>
              where.OR === undefined ||
              where.OR.some(
                (condition) =>
                  condition.primaryPublicPath === shop.primaryPublicPath ||
                  condition.secondaryPublicPath === shop.secondaryPublicPath,
              ),
          )
          .map((shop) => {
            return {
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
            };
          }),
      findFirst: async (args: {
        where: {
          isDeleted?: boolean;
          status?: "WORKING" | "NOT_WORKING";
          sellerId?: string;
          OR?: Array<{
            primaryPublicPath?: string;
            secondaryPublicPath?: string;
          }>;
        };
        select?: {
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
        };
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
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
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
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
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
        const shop = target.shops.find((candidate) => candidate.id === where.id);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        if (
          target.shops.some(
            (candidate) =>
              candidate.id !== where.id && candidate.sellerId === shop.sellerId && candidate.name === data.name,
          )
        ) {
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
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
        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

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

        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

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
        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

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

        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

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
    sellerShopBinding: {
      findMany: async ({ where }: { where: { telegramId: string } }) =>
        target.bindings
          .filter((binding) => binding.telegramId === where.telegramId)
          .map((binding) => ({ ...binding })),
      create: async ({ data }: { data: { shopId: string; sellerId: string; telegramId: string } }) => {
        if (target.bindings.some((binding) => binding.shopId === data.shopId)) {
          const error = new Error("duplicate binding");
          Object.assign(error, { code: "P2002" });
          throw error;
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
    const draftState = cloneCatalogState(state);
    const result = await callback(createClient(draftState));
    Object.assign(state, draftState);
    options.persist?.(state);
    return result;
  };

  return createPrismaProvider(client as never);
};
