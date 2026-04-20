import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { PrismaCatalogRepository } from "../../../backend/src/slices/catalog/infrastructure/prisma-catalog.repository";
import { adminOrigin, loginAdmin, loginSeller } from "./catalog.runtime.test-helpers";

export const registerCatalogRuntimeProvisioningCases = () => {
  it("fails closed for anonymous and non-admin callers before allowing admin provisioning", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const anonymousClient = runtime.createClient();
      const anonymousResponse = await anonymousClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-anonymous",
          telegramId: "seller-telegram-anonymous",
          name: "Anonymous Shop",
        },
      });

      expect(anonymousResponse.status).toBe(401);
      expect(anonymousResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Provisioning requires an authenticated admin",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Anonymous Shop")).toBe(false);

      runtime.prisma.state.account.role = "MANAGER";
      const managerClient = runtime.createClient();
      await loginAdmin(managerClient);

      const managerResponse = await managerClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-manager",
          telegramId: "seller-telegram-manager",
          name: "Manager Shop",
        },
      });

      expect(managerResponse.status).toBe(403);
      expect(managerResponse.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "User role cannot provision seller shops",
          details: {
            role: "manager",
          },
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Manager Shop")).toBe(false);

      runtime.prisma.state.account.role = "BOSS";
      const client = runtime.createClient();
      await loginAdmin(client);
      const createResponse = await client.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-3",
          telegramId: "seller-telegram-3",
          name: "Provisioned Shop",
        },
      });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toEqual({
        shop: expect.objectContaining({
          sellerId: "seller-3",
          name: "Provisioned Shop",
          status: "WORKING",
        }),
        binding: expect.objectContaining({
          sellerId: "seller-3",
          telegramId: "seller-telegram-3",
        }),
        menuPages: expect.arrayContaining([
          expect.objectContaining({ name: "Popular" }),
          expect.objectContaining({ name: "Drinks" }),
        ]),
        products: expect.arrayContaining([
          expect.objectContaining({ name: "Starter Dish" }),
          expect.objectContaining({ name: "Starter Drink" }),
        ]),
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Provisioned Shop")).toBe(true);

      const conflictResponse = await client.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-3",
          telegramId: "seller-telegram-3",
          name: "Provisioned Shop",
        },
      });

      expect(conflictResponse.status).toBe(409);
      expect(conflictResponse.body).toEqual({
        error: {
          code: "SHOP_PROVISIONING_CONFLICT",
          message: "Shop provisioning conflicts with an existing seller binding or shop record",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.filter((shop) => shop.name === "Provisioned Shop")).toHaveLength(1);
    } finally {
      await runtime.stop();
    }
  });

  it("accepts multiple admin-provisioned shops for one seller identity when names differ", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      runtime.prisma.state.account.role = "BOSS";
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const firstResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-multi-shop",
          telegramId: "921",
          name: "Tea House",
        },
      });

      const secondResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-multi-shop",
          telegramId: "921",
          name: "Bakery Corner",
        },
      });

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      expect(
        runtime.catalogState.shops.filter(
          (shop) => shop.sellerId === "seller-multi-shop" && ["Tea House", "Bakery Corner"].includes(shop.name),
        ),
      ).toHaveLength(2);
      expect(
        runtime.catalogState.bindings.filter(
          (binding) => binding.sellerId === "seller-multi-shop" && binding.telegramId === "921",
        ),
      ).toHaveLength(2);

      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "921");

      const sellerShopsResponse = await sellerClient.request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(sellerShopsResponse.status).toBe(200);
      expect(sellerShopsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Tea House" }),
          expect.objectContaining({ name: "Bakery Corner" }),
        ]),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("loads the admin provisioning shop list from persisted catalog state including not-working shops", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "khujandi-admin-provisioning-list-"));
    const catalogDatabasePath = join(tempDir, "catalog-runtime.sqlite");
    let runtime: Awaited<ReturnType<typeof startDevApiServer>> | null = null;

    try {
      runtime = await startDevApiServer({
        host: "127.0.0.1",
        port: 0,
        catalogDatabasePath,
      });

      runtime.prisma.state.account.role = "BOSS";
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const workingResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-admin-list-1",
          telegramId: "5001",
          name: "Working Shop",
          status: "WORKING",
        },
      });
      const hiddenResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-admin-list-2",
          telegramId: "5002",
          name: "Hidden Shop",
          status: "NOT_WORKING",
        },
      });

      expect(workingResponse.status).toBe(201);
      expect(hiddenResponse.status).toBe(201);

      const listResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shopId: expect.any(String),
            shopName: "Working Shop",
            status: "WORKING",
            sellerId: "seller-admin-list-1",
            telegramId: "5001",
            primaryPublicPath: expect.any(String),
            secondaryPublicPath: expect.any(String),
          }),
          expect.objectContaining({
            shopId: expect.any(String),
            shopName: "Hidden Shop",
            status: "NOT_WORKING",
            sellerId: "seller-admin-list-2",
            telegramId: "5002",
            primaryPublicPath: expect.any(String),
            secondaryPublicPath: expect.any(String),
          }),
        ]),
      );

      await runtime.stop();
      runtime = null;

      runtime = await startDevApiServer({
        host: "127.0.0.1",
        port: 0,
        catalogDatabasePath,
      });

      runtime.prisma.state.account.role = "BOSS";
      const reloadedAdminClient = runtime.createClient();
      await loginAdmin(reloadedAdminClient);

      const reloadedListResponse = await reloadedAdminClient.request({
        path: "/api/v1/admin/catalog/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(reloadedListResponse.status).toBe(200);
      expect(reloadedListResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shopId: expect.any(String),
            shopName: "Working Shop",
            status: "WORKING",
            sellerId: "seller-admin-list-1",
            telegramId: "5001",
            primaryPublicPath: expect.any(String),
            secondaryPublicPath: expect.any(String),
          }),
          expect.objectContaining({
            shopId: expect.any(String),
            shopName: "Hidden Shop",
            status: "NOT_WORKING",
            sellerId: "seller-admin-list-2",
            telegramId: "5002",
            primaryPublicPath: expect.any(String),
            secondaryPublicPath: expect.any(String),
          }),
        ]),
      );
    } finally {
      if (runtime !== null) {
        await runtime.stop();
      }

      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed for the same seller shop identity even when telegramId differs", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      runtime.prisma.state.account.role = "BOSS";
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const firstResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-same-shop",
          telegramId: "111",
          name: "Bakery",
        },
      });

      const duplicateResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-same-shop",
          telegramId: "222",
          name: "Bakery",
        },
      });

      expect(firstResponse.status).toBe(201);
      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body).toEqual({
        error: {
          code: "SHOP_PROVISIONING_CONFLICT",
          message: "Shop provisioning conflicts with an existing seller binding or shop record",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(
        runtime.catalogState.shops.filter(
          (shop) => shop.sellerId === "seller-same-shop" && shop.name === "Bakery",
        ),
      ).toHaveLength(1);
      expect(runtime.catalogState.bindings.filter((binding) => binding.sellerId === "seller-same-shop")).toHaveLength(1);
      expect(runtime.catalogState.bindings[0]?.telegramId).toBe("111");
    } finally {
      await runtime.stop();
    }
  });

  it("rejects refresh-only, forged-access, or expired protected admin sessions before provisioning writes", async () => {
    let now = new Date("2026-04-10T10:00:00.000Z");
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      now: () => now,
    });

    try {
      const refreshOnlyClient = runtime.createClient();
      await loginAdmin(refreshOnlyClient);
      expect(refreshOnlyClient.readCookieValue("khujandi_admin_access_token")).not.toBeNull();
      refreshOnlyClient.deleteCookie("khujandi_admin_access_token");

      const refreshOnlyResponse = await refreshOnlyClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-refresh-only",
          telegramId: "seller-telegram-refresh-only",
          name: "Refresh Only Shop",
        },
      });

      expect(refreshOnlyResponse.status).toBe(401);
      expect(refreshOnlyResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Provisioning requires an authenticated admin",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Refresh Only Shop")).toBe(false);

      const forgedAccessClient = runtime.createClient();
      await loginAdmin(forgedAccessClient);
      forgedAccessClient.setCookieValue("khujandi_admin_access_token", "forged-access-token");

      const forgedAccessResponse = await forgedAccessClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-forged-access",
          telegramId: "seller-telegram-forged-access",
          name: "Forged Access Shop",
        },
      });

      expect(forgedAccessResponse.status).toBe(401);
      expect(forgedAccessResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Provisioning requires an authenticated admin",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Forged Access Shop")).toBe(false);

      const expiredClient = runtime.createClient();
      await loginAdmin(expiredClient);
      now = new Date("2026-04-10T10:16:00.000Z");

      const expiredResponse = await expiredClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-expired-access",
          telegramId: "seller-telegram-expired-access",
          name: "Expired Access Shop",
        },
      });

      expect(expiredResponse.status).toBe(401);
      expect(expiredResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Provisioning requires an authenticated admin",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Expired Access Shop")).toBe(false);

      const refreshedResponse = await expiredClient.request({
        path: "/api/v1/admin/auth/refresh",
        origin: adminOrigin,
      });

      expect(refreshedResponse.status).toBe(200);

      const provisionedResponse = await expiredClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-after-refresh",
          telegramId: "seller-telegram-after-refresh",
          name: "Provisioned After Refresh",
        },
      });

      expect(provisionedResponse.status).toBe(201);
      expect(runtime.catalogState.shops.some((shop) => shop.name === "Provisioned After Refresh")).toBe(true);
    } finally {
      await runtime.stop();
    }
  });

  it("keeps identical mounted provisioning requests fail-closed with one durable starter bundle", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      runtime.prisma.state.account.role = "BOSS";
      const client = runtime.createClient();
      await loginAdmin(client);

      const [firstResponse, secondResponse] = await Promise.all([
        client.request({
          path: "/api/v1/admin/catalog/shops/provision",
          origin: adminOrigin,
          body: {
            sellerId: "seller-race",
            telegramId: "seller-telegram-race",
            name: "Race Safe Shop",
          },
        }),
        client.request({
          path: "/api/v1/admin/catalog/shops/provision",
          origin: adminOrigin,
          body: {
            sellerId: "seller-race",
            telegramId: "seller-telegram-race",
            name: "Race Safe Shop",
          },
        }),
      ]);

      expect([firstResponse.status, secondResponse.status].sort()).toEqual([201, 409]);
      expect(runtime.catalogState.shops.filter((shop) => shop.sellerId === "seller-race" && shop.name === "Race Safe Shop")).toHaveLength(1);
      expect(runtime.catalogState.bindings.filter((binding) => binding.sellerId === "seller-race" && binding.telegramId === "seller-telegram-race")).toHaveLength(1);
      expect(runtime.catalogState.menuPages.filter((page) => page.shopId === runtime.catalogState.shops.find((shop) => shop.sellerId === "seller-race" && shop.name === "Race Safe Shop")?.id)).toHaveLength(2);
      expect(runtime.catalogState.products.filter((product) => product.shopId === runtime.catalogState.shops.find((shop) => shop.sellerId === "seller-race" && shop.name === "Race Safe Shop")?.id)).toHaveLength(2);
    } finally {
      await runtime.stop();
    }
  });

  it("mounts the repo-local catalog runtime on the Prisma-backed module by default", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      expect(runtime.catalogModule.repository).toBeInstanceOf(PrismaCatalogRepository);
    } finally {
      await runtime.stop();
    }
  });

  it("reuses persisted catalog state across runtime restart instead of reseeding hidden demo memory", async () => {
    const runtimeDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-runtime-test-"));
    const catalogDatabasePath = join(runtimeDirectory, "catalog-runtime.sqlite");

    const firstRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const initialBrowseResponse = await firstRuntime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(initialBrowseResponse.status).toBe(200);
      expect(initialBrowseResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "shop-1", name: "Плов в парке Сомони" }),
          expect.objectContaining({ id: "shop-2", name: "Бобоча самбуса" }),
        ]),
      );

      const adminClient = firstRuntime.createClient();
      await loginAdmin(adminClient);

      const provisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-restart-safe",
          telegramId: "919",
          name: "Restart Safe Bakery",
        },
      });

      expect(provisionResponse.status).toBe(201);
      expect(firstRuntime.catalogState.shops.some((shop) => shop.name === "Restart Safe Bakery")).toBe(true);
    } finally {
      await firstRuntime.stop();
    }

    const restartedRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const restartedBrowseResponse = await restartedRuntime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(restartedBrowseResponse.status).toBe(200);
      expect(restartedBrowseResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "shop-1", name: "Плов в парке Сомони" }),
          expect.objectContaining({ id: "shop-2", name: "Бобоча самбуса" }),
          expect.objectContaining({ name: "Restart Safe Bakery" }),
        ]),
      );
      expect(restartedRuntime.catalogState.shops.filter((shop) => shop.name === "Restart Safe Bakery")).toHaveLength(1);
    } finally {
      await restartedRuntime.stop();
      rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });

  it("resolves seller storefront data from persisted catalog state after runtime restart", async () => {
    const runtimeDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-storefront-test-"));
    const catalogDatabasePath = join(runtimeDirectory, "catalog-runtime.sqlite");
    let shopId = "";
    let productId = "";
    let menuPageId = "";

    const firstRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const adminClient = firstRuntime.createClient();
      await loginAdmin(adminClient);

      const provisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-storefront-restart",
          telegramId: "920",
          name: "Restart Seller Storefront",
          status: "NOT_WORKING",
        },
      });

      expect(provisionResponse.status).toBe(201);
      const provisionedBody = provisionResponse.body as {
        shop: { id: string };
        menuPages: Array<{ id: string }>;
        products: Array<{ id: string }>;
      };
      shopId = provisionedBody.shop.id;
      menuPageId = provisionedBody.menuPages[0]!.id;
      productId = provisionedBody.products[0]!.id;

      const sellerClient = firstRuntime.createClient();
      await loginSeller(sellerClient, "920");

      const updateProductResponse = await sellerClient.request({
        path: `/api/v1/seller/products/${productId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          shopId,
          menuPageId,
          name: "Persisted Seller Product",
          description: "Survives restart on canonical seller storefront reads",
          imageUrl: null,
          priceMinor: 2200,
        },
      });

      expect(updateProductResponse.status).toBe(200);
    } finally {
      await firstRuntime.stop();
    }

    const restartedRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const sellerClient = restartedRuntime.createClient();
      await loginSeller(sellerClient, "920");

      const sellerShopsResponse = await sellerClient.request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(sellerShopsResponse.status).toBe(200);
      expect(sellerShopsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: shopId,
            name: "Restart Seller Storefront",
            status: "NOT_WORKING",
          }),
        ]),
      );

      const storefrontResponse = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(storefrontResponse.status).toBe(200);
      expect(storefrontResponse.body).toEqual(
        expect.objectContaining({
          id: shopId,
          status: "NOT_WORKING",
          menuPages: expect.arrayContaining([
            expect.objectContaining({
              id: menuPageId,
              products: expect.arrayContaining([
                expect.objectContaining({
                  id: productId,
                  name: "Persisted Seller Product",
                  description: "Survives restart on canonical seller storefront reads",
                  priceMinor: 2200,
                }),
              ]),
            }),
          ]),
        }),
      );
    } finally {
      await restartedRuntime.stop();
      rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });

  it("keeps repeated identical provisioning fail-closed after runtime restart on the same persisted DB path", async () => {
    const runtimeDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-conflict-restart-test-"));
    const catalogDatabasePath = join(runtimeDirectory, "catalog-runtime.sqlite");

    const firstRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const adminClient = firstRuntime.createClient();
      await loginAdmin(adminClient);

      const firstProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-conflict-restart",
          telegramId: "921",
          name: "Restart Conflict Bakery",
        },
      });

      expect(firstProvisionResponse.status).toBe(201);
      expect(firstRuntime.catalogState.shops.filter((shop) => shop.name === "Restart Conflict Bakery")).toHaveLength(1);
      expect(firstRuntime.catalogState.bindings.filter((binding) => binding.telegramId === "921")).toHaveLength(1);
    } finally {
      await firstRuntime.stop();
    }

    const restartedRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      catalogDatabasePath,
    });

    try {
      const adminClient = restartedRuntime.createClient();
      await loginAdmin(adminClient);

      const repeatedProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-conflict-restart",
          telegramId: "921",
          name: "Restart Conflict Bakery",
        },
      });

      expect(repeatedProvisionResponse.status).toBe(409);
      expect(repeatedProvisionResponse.body).toEqual({
        error: {
          code: "SHOP_PROVISIONING_CONFLICT",
          message: "Shop provisioning conflicts with an existing seller binding or shop record",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });
      expect(
        restartedRuntime.catalogState.shops.filter(
          (shop) => shop.sellerId === "seller-conflict-restart" && shop.name === "Restart Conflict Bakery",
        ),
      ).toHaveLength(1);

      const persistedShop = restartedRuntime.catalogState.shops.find(
        (shop) => shop.sellerId === "seller-conflict-restart" && shop.name === "Restart Conflict Bakery",
      );

      expect(persistedShop).toBeDefined();
      expect(
        restartedRuntime.catalogState.bindings.filter(
          (binding) => binding.sellerId === "seller-conflict-restart" && binding.telegramId === "921",
        ),
      ).toHaveLength(1);
      expect(restartedRuntime.catalogState.menuPages.filter((page) => page.shopId === persistedShop?.id)).toHaveLength(2);
      expect(restartedRuntime.catalogState.products.filter((product) => product.shopId === persistedShop?.id)).toHaveLength(2);
    } finally {
      await restartedRuntime.stop();
      rmSync(runtimeDirectory, { recursive: true, force: true });
    }
  });
};
