import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createPrismaProvider } from "../../../backend/src/shared/db/prisma-client";
import { AppError } from "../../../backend/src/shared/errors/app-error";

type ProvisioningState = {
  shops: Array<{
    id: string;
    sellerId: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    status: "WORKING" | "NOT_WORKING";
    renameCount: number;
    requiresManualRenameReview: boolean;
    isDeleted: boolean;
  }>;
  bindings: Array<{
    id: string;
    shopId: string;
    sellerId: string;
    telegramId: string;
  }>;
  menuPages: Array<{
    id: string;
    shopId: string;
    name: string;
    position: number;
  }>;
  products: Array<{
    id: string;
    shopId: string;
    menuPageId: string | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceMinor: number;
    isDeleted: boolean;
  }>;
  nextShopId: number;
  nextBindingId: number;
  nextMenuPageId: number;
  nextProductId: number;
};

const cloneState = (state: ProvisioningState): ProvisioningState => ({
  shops: state.shops.map((shop) => ({ ...shop })),
  bindings: state.bindings.map((binding) => ({ ...binding })),
  menuPages: state.menuPages.map((page) => ({ ...page })),
  products: state.products.map((product) => ({ ...product })),
  nextShopId: state.nextShopId,
  nextBindingId: state.nextBindingId,
  nextMenuPageId: state.nextMenuPageId,
  nextProductId: state.nextProductId,
});

const createProvisioningPrisma = (options: {
  failOnProductName?: string;
  conflictOnBinding?: boolean;
  stallConcurrentShopCreate?: boolean;
} = {}) => {
  const state: ProvisioningState = {
    shops: [],
    bindings: [],
    menuPages: [],
    products: [],
    nextShopId: 1,
    nextBindingId: 1,
    nextMenuPageId: 1,
    nextProductId: 1,
  };

  let concurrentShopCreateCount = 0;
  let releaseConcurrentShopCreate: (() => void) | null = null;

  const waitForConcurrentShopCreate = async () => {
    if (options.stallConcurrentShopCreate !== true) {
      return;
    }

    await new Promise<void>((resolve) => {
      concurrentShopCreateCount += 1;

      if (concurrentShopCreateCount === 1) {
        releaseConcurrentShopCreate = resolve;
        return;
      }

      releaseConcurrentShopCreate?.();
      resolve();
    });
  };

  const throwUniqueConstraintError = () => {
    const error = new Error("duplicate");
    Object.assign(error, { code: "P2002" });
    throw error;
  };

  const hasDuplicateShopIdentity = (target: ProvisioningState, sellerId: string, name: string) =>
    target.shops.some((shop) => shop.sellerId === sellerId && shop.name === name);

  const createClient = (target: ProvisioningState) => ({
    shop: {
      findMany: async () => [],
      findUnique: async ({ where }: { where: { id: string } }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.id) ?? null;
        return shop === null ? null : { ...shop };
      },
      create: async ({ data }: { data: { sellerId: string; name: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status: "WORKING" | "NOT_WORKING" } }) => {
        await waitForConcurrentShopCreate();

        if (hasDuplicateShopIdentity(target, data.sellerId, data.name)) {
          throwUniqueConstraintError();
        }

        const shop = {
          id: `shop-${target.nextShopId++}`,
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
        return { ...shop };
      },
      update: async () => {
        throw new Error("not used");
      },
    },
    menuPage: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: { shopId: string; name: string; position: number } }) => {
        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("unknown shop");
        }

        const page = {
          id: `page-${target.nextMenuPageId++}`,
          shopId: data.shopId,
          name: data.name,
          position: data.position,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: false,
            status: shop.status,
          },
        };
        target.menuPages.push({ id: page.id, shopId: page.shopId, name: page.name, position: page.position });
        return page;
      },
    },
    product: {
      findMany: async () => [],
      findUnique: async () => null,
      create: async ({ data }: { data: { shopId: string; menuPageId?: string | null; name: string; description?: string | null; imageUrl?: string | null; priceMinor: number } }) => {
        if (options.failOnProductName === data.name) {
          throw new Error("starter product creation failed");
        }

        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("unknown shop");
        }

        const product = {
          id: `product-${target.nextProductId++}`,
          shopId: data.shopId,
          menuPageId: data.menuPageId ?? null,
          name: data.name,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          priceMinor: data.priceMinor,
          isDeleted: false,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: false,
          },
        };
        target.products.push({
          id: product.id,
          shopId: product.shopId,
          menuPageId: product.menuPageId,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          priceMinor: product.priceMinor,
          isDeleted: false,
        });
        return product;
      },
      update: async () => {
        throw new Error("not used");
      },
    },
    sellerShopBinding: {
      findMany: async ({ where }: { where: { telegramId: string } }) =>
        target.bindings
          .filter((binding) => binding.telegramId === where.telegramId)
          .map((binding) => ({ ...binding })),
      create: async ({ data }: { data: { shopId: string; sellerId: string; telegramId: string } }) => {
        if (options.conflictOnBinding) {
          throwUniqueConstraintError();
        }

        const binding = {
          id: `binding-${target.nextBindingId++}`,
          shopId: data.shopId,
          sellerId: data.sellerId,
          telegramId: data.telegramId,
        };
        target.bindings.push(binding);
        return { ...binding };
      },
    },
  });

  const client = createClient(state) as ReturnType<typeof createClient> & {
    $transaction<T>(callback: (transactionClient: ReturnType<typeof createClient>) => Promise<T>): Promise<T>;
  };

  client.$transaction = async (callback) => {
    const initialShopCount = state.shops.length;
    const draftState = cloneState(state);
    const result = await callback(createClient(draftState));

    const hasCommittedDuplicateShop = draftState.shops.slice(initialShopCount).some((draftShop) =>
      state.shops.some(
        (committedShop) => committedShop.sellerId === draftShop.sellerId && committedShop.name === draftShop.name,
      ),
    );

    if (hasCommittedDuplicateShop) {
      throwUniqueConstraintError();
    }

    Object.assign(state, draftState);
    return result;
  };

  return {
    state,
    prisma: createPrismaProvider(client as never),
  };
};

describe("catalog provisioning integration", () => {
  it("atomically provisions shop, binding, starter pages, and starter products", async () => {
    const { prisma, state } = createProvisioningPrisma();
    const module = createCatalogModule(prisma);

    const result = await module.controller.provisionShop({
      sellerId: "seller-1",
      telegramId: "123456",
      name: "Bakery",
    });

    expect(result.shop).toMatchObject({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      status: "WORKING",
    });
    expect(result.binding).toEqual({
      id: "binding-1",
      shopId: "shop-1",
      sellerId: "seller-1",
      telegramId: "123456",
    });
    expect(result.menuPages.map((page) => page.name)).toEqual(["Popular", "Drinks"]);
    expect(result.products.map((product) => product.name)).toEqual(["Starter Dish", "Starter Drink"]);
    expect(state.shops).toHaveLength(1);
    expect(state.bindings).toHaveLength(1);
    expect(state.menuPages).toHaveLength(2);
    expect(state.products).toHaveLength(2);
    expect(state.bindings[0].sellerId).toBe(state.shops[0].sellerId);
  });

  it("maps duplicate binding conflicts to a controlled provisioning error and commits nothing", async () => {
    const { prisma, state } = createProvisioningPrisma({ conflictOnBinding: true });
    const module = createCatalogModule(prisma);

    await expect(
      module.controller.provisionShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
    ).rejects.toEqual(
      new AppError(
        "SHOP_PROVISIONING_CONFLICT",
        "Shop provisioning conflicts with an existing seller binding or shop record",
        409,
      ),
    );
    expect(state.shops).toHaveLength(0);
    expect(state.bindings).toHaveLength(0);
    expect(state.menuPages).toHaveLength(0);
    expect(state.products).toHaveLength(0);
  });

  it("fails closed for repeated provisioning of the same seller binding and shop identity", async () => {
    const { prisma, state } = createProvisioningPrisma();
    const module = createCatalogModule(prisma);

    await module.controller.provisionShop({
      sellerId: "seller-1",
      telegramId: "123456",
      name: "Bakery",
    });

    await expect(
      module.controller.provisionShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
    ).rejects.toEqual(
      new AppError(
        "SHOP_PROVISIONING_CONFLICT",
        "Shop provisioning conflicts with an existing seller binding or shop record",
        409,
      ),
    );

    expect(state.shops).toHaveLength(1);
    expect(state.bindings).toHaveLength(1);
    expect(state.menuPages).toHaveLength(2);
    expect(state.products).toHaveLength(2);
  });

  it("allows multiple admin-provisioned shops for one seller identity when shop names differ", async () => {
    const { prisma, state } = createProvisioningPrisma();
    const module = createCatalogModule(prisma);

    const firstResult = await module.controller.provisionShop({
      sellerId: "seller-1",
      telegramId: "123456",
      name: "Bakery",
    });

    const secondResult = await module.controller.provisionShop({
      sellerId: "seller-1",
      telegramId: "123456",
      name: "Coffee Corner",
    });

    expect(firstResult.shop.id).not.toBe(secondResult.shop.id);
    expect(state.shops).toHaveLength(2);
    expect(state.shops.map((shop) => shop.name)).toEqual(["Bakery", "Coffee Corner"]);
    expect(state.bindings).toHaveLength(2);
    expect(state.bindings.every((binding) => binding.sellerId === "seller-1")).toBe(true);
    expect(state.bindings.every((binding) => binding.telegramId === "123456")).toBe(true);
    expect(state.menuPages).toHaveLength(4);
    expect(state.products).toHaveLength(4);
  });

  it("keeps concurrent identical provisioning race-safe at the persistence boundary", async () => {
    const { prisma, state } = createProvisioningPrisma({ stallConcurrentShopCreate: true });
    const module = createCatalogModule(prisma);

    const results = await Promise.allSettled([
      module.controller.provisionShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
      module.controller.provisionShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(results.some((result) => result.status === "rejected" && result.reason instanceof AppError)).toBe(true);
    expect(results).toContainEqual({
      status: "rejected",
      reason: new AppError(
        "SHOP_PROVISIONING_CONFLICT",
        "Shop provisioning conflicts with an existing seller binding or shop record",
        409,
      ),
    });
    expect(state.shops).toHaveLength(1);
    expect(state.bindings).toHaveLength(1);
    expect(state.menuPages).toHaveLength(2);
    expect(state.products).toHaveLength(2);
  });

  it("rolls back the whole provisioning transaction when starter product creation fails", async () => {
    const { prisma, state } = createProvisioningPrisma({ failOnProductName: "Starter Drink" });
    const module = createCatalogModule(prisma);

    await expect(
      module.controller.provisionShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
    ).rejects.toThrow("starter product creation failed");
    expect(state.shops).toHaveLength(0);
    expect(state.bindings).toHaveLength(0);
    expect(state.menuPages).toHaveLength(0);
    expect(state.products).toHaveLength(0);
  });
});
