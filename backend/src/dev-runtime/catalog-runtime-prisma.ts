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
      findMany: async ({ where }: { where: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } }) =>
        target.shops
          .filter((shop) => shop.isDeleted === where.isDeleted)
          .filter((shop) => where.status === undefined || shop.status === where.status)
          .map((shop) => ({ id: shop.id, name: shop.name })),
      findUnique: async ({ where }: { where: { id: string } }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.id) ?? null;
        return shop === null ? null : { ...shop };
      },
      create: async ({ data }: { data: { sellerId: string; name: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status: "WORKING" | "NOT_WORKING" } }) => {
        if (target.shops.some((shop) => shop.sellerId === data.sellerId && shop.name === data.name)) {
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
        }

        const shop: SellerCatalogShop = {
          id: `shop-runtime-${target.nextShopId++}`,
          sellerId: data.sellerId,
          name: data.name,
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
        select?: { shop?: { select: { sellerId: boolean; isDeleted?: boolean } } };
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
          .map((product) => {
            if (select?.shop !== undefined) {
              return {
                id: product.id,
                shopId: product.shopId,
                menuPageId: product.menuPageId,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                priceMinor: product.priceMinor,
                isDeleted: product.isDeleted,
                shop: {
                  sellerId: shop.sellerId,
                  isDeleted: shop.isDeleted,
                },
              };
            }

            return {
              id: product.id,
              shopId: product.shopId,
              menuPageId: product.menuPageId,
              name: product.name,
              priceMinor: product.priceMinor,
            };
          });
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
        if (target.bindings.some((binding) => binding.sellerId === data.sellerId || binding.telegramId === data.telegramId)) {
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
