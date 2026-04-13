import { createHmac } from "crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryCatalogRepository, createCatalogRuntimeState, startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import type { RuntimeCookieSessionClient } from "../../../backend/src/dev-runtime/dev-api-server";
import { PrismaCatalogRepository } from "../../../backend/src/slices/catalog/infrastructure/prisma-catalog.repository";

describe("catalog provisioning runtime", () => {
  const adminOrigin = "http://127.0.0.1:5173";
  const createTelegramInitData = (input: {
    authDate: number;
    telegramId: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  }): string => {
    const params = new URLSearchParams();
    params.set("auth_date", String(input.authDate));
    params.set("query_id", "AAEAAAE");
    params.set(
      "user",
      JSON.stringify({
        id: Number(input.telegramId),
        first_name: input.firstName ?? "Khujand",
        last_name: input.lastName ?? "Seller",
        username: input.username ?? `seller_${input.telegramId}`,
        language_code: input.languageCode ?? "ru",
      }),
    );

    const dataCheckString = Array.from(params.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const secretKey = createHmac("sha256", "WebAppData").update("test-bot-token").digest();
    params.set("hash", createHmac("sha256", secretKey).update(dataCheckString).digest("hex"));
    return params.toString();
  };

  const loginAdmin = async (client: RuntimeCookieSessionClient) => {
    const response = await client.request({
      path: "/api/v1/admin/auth/login",
      origin: adminOrigin,
      body: {
        login: "boss@example.com",
        password: "super-secret-01",
      },
    });

    expect(response.status).toBe(200);
    expect(client.readCookieValue("khujandi_admin_refresh_token")).not.toBeNull();
  };

  const loginSeller = async (client: RuntimeCookieSessionClient, telegramId: string) => {
    const response = await client.request({
      path: "/api/v1/auth/telegram",
      origin: adminOrigin,
      body: {
        initData: createTelegramInitData({
          authDate: Math.floor(Date.now() / 1000),
          telegramId,
        }),
      },
    });

    expect(response.status).toBe(200);
    expect(client.readCookieValue("khujandi_mini_app_session")).not.toBeNull();
  };

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

  it("keeps public browse auth-free while allowing the owning seller to read not-working shops through the protected seller boundary", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const provisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-hidden",
          telegramId: "101",
          name: "Hidden Seller Shop",
          status: "NOT_WORKING",
        },
      });

      expect(provisionResponse.status).toBe(201);
      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "101");
      expect(runtime.checkoutPaymentState.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telegramId: "101",
            isActive: true,
          }),
        ]),
      );
      expect(runtime.checkoutPaymentState.sessions).toHaveLength(1);

      const sellerShopsResponse = await sellerClient.request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(sellerShopsResponse.status).toBe(200);
      expect(sellerShopsResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Hidden Seller Shop",
            status: "NOT_WORKING",
          }),
        ]),
      );

      const publicBrowseResponse = await runtime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
      });

      expect(publicBrowseResponse.status).toBe(200);
      expect(publicBrowseResponse.body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "Hidden Seller Shop" })]),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("issues Mini App session cookies from the shared auth boundary instead of the old route-local token convention", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const client = runtime.createClient();
      const authResponse = await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: "303",
          }),
        },
      });

      expect(authResponse.status).toBe(200);
      expect(client.readCookieValue("khujandi_mini_app_session")).not.toBeNull();
      expect(client.readCookieValue("khujandi_mini_app_session")).not.toBe("mini-app-session-token-1");
      expect(String(authResponse.headers["set-cookie"] ?? "")).not.toContain("mini-app-session-token-");
      expect(runtime.checkoutPaymentState.sessions).toHaveLength(1);
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

  it("keeps seller write observability explicit in the in-memory catalog adapter", async () => {
    const state = createCatalogRuntimeState();
    const repository = new InMemoryCatalogRepository(state);

    const createdMenuPage = await repository.createMenuPage({
      shopId: "shop-1",
      name: "Seasonal",
      position: 1,
    });
    const updatedShop = await repository.updateShop("shop-1", {
      name: "Плов в новом парке",
      renameCount: 1,
      requiresManualRenameReview: false,
    });
    const createdProduct = await repository.createProduct({
      shopId: "shop-1",
      menuPageId: createdMenuPage.record.id,
      name: "Весенний плов",
      priceMinor: 4900,
    });

    expect(createdMenuPage.record).toMatchObject({
      shopId: "shop-1",
      name: "Seasonal",
    });
    expect(createdMenuPage.event).toMatchObject({
      type: "catalog.menu_page.created",
      entity: "menu_page",
      entityId: createdMenuPage.record.id,
      payload: expect.objectContaining({
        menuPageId: createdMenuPage.record.id,
        shopId: "shop-1",
      }),
    });
    expect(updatedShop.event).toMatchObject({
      type: "catalog.shop.updated",
      entity: "shop",
      entityId: "shop-1",
      payload: expect.objectContaining({
        shopId: "shop-1",
        name: "Плов в новом парке",
      }),
    });
    expect(createdProduct.event).toMatchObject({
      type: "catalog.product.created",
      entity: "product",
      entityId: createdProduct.record.id,
      payload: expect.objectContaining({
        productId: createdProduct.record.id,
        menuPageId: createdMenuPage.record.id,
      }),
    });
    expect(state.events).toEqual([
      createdMenuPage.event,
      updatedShop.event,
      createdProduct.event,
    ]);
  });

  it("serves canonical owner-visible storefront data and accepts seller write calls on the shared storefront boundary", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const provisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-owner-runtime",
          telegramId: "701",
          name: "Night Bakery",
          status: "NOT_WORKING",
        },
      });

      expect(provisionResponse.status).toBe(201);

      const provisionedBody = provisionResponse.body as {
        shop: { id: string };
        menuPages: Array<{ id: string }>;
        products: Array<{ id: string; name: string }>;
      };
      const shopId = provisionedBody.shop.id;
      const menuPageId = provisionedBody.menuPages[0].id;
      const productId = provisionedBody.products[0].id;

      const publicShopsResponse = await runtime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(publicShopsResponse.status).toBe(200);
      expect(publicShopsResponse.body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: shopId })]),
      );

      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "701");

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
                  name: "Starter Dish",
                }),
              ]),
            }),
          ]),
        }),
      );

      const updateProductResponse = await sellerClient.request({
        path: `/api/v1/seller/products/${productId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          shopId,
          menuPageId,
          name: "Starter Dish Deluxe",
          description: "Owner-visible canonical update",
          imageUrl: null,
          priceMinor: 1800,
        },
      });

      expect(updateProductResponse.status).toBe(200);

      const updatedStorefrontResponse = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(updatedStorefrontResponse.status).toBe(200);
      expect(updatedStorefrontResponse.body).toEqual(
        expect.objectContaining({
          menuPages: expect.arrayContaining([
            expect.objectContaining({
              id: menuPageId,
              products: expect.arrayContaining([
                expect.objectContaining({
                  id: productId,
                  name: "Starter Dish Deluxe",
                  description: "Owner-visible canonical update",
                  priceMinor: 1800,
                }),
              ]),
            }),
          ]),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("keeps legacy seller products visible on owner storefront reads when they have no menu page linkage", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      runtime.catalogState.bindings.push({
        id: "binding-legacy-1",
        sellerId: "seller-runtime-1",
        shopId: "shop-1",
        telegramId: "101",
      });

      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "101");

      const storefrontResponse = await sellerClient.request({
        path: "/api/v1/seller/shops/shop-1",
        method: "GET",
        origin: adminOrigin,
      });

      expect(storefrontResponse.status).toBe(200);
      expect(storefrontResponse.body).toEqual(
        expect.objectContaining({
          id: "shop-1",
          menuPages: [],
          unpagedProducts: expect.arrayContaining([
            expect.objectContaining({
              id: "product-1",
              menuPageId: null,
              name: "Плов зарвода",
            }),
            expect.objectContaining({
              id: "product-2",
              menuPageId: null,
              name: "Плов обычный",
            }),
          ]),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("lets an owning seller toggle shop visibility through the mounted seller runtime and hides NOT_WORKING shops from public browse", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const provisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-toggle-owner",
          telegramId: "808",
          name: "Toggle Bakery",
          status: "WORKING",
        },
      });

      expect(provisionResponse.status).toBe(201);

      const shopId = (provisionResponse.body as { shop: { id: string } }).shop.id;

      const publicBeforeToggle = await runtime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(publicBeforeToggle.status).toBe(200);
      expect(publicBeforeToggle.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: shopId, name: "Toggle Bakery" })]),
      );

      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "808");

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
            status: "WORKING",
          }),
        ]),
      );

      const toggleResponse = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          status: "NOT_WORKING",
        },
      });

      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.body).toEqual(
        expect.objectContaining({
          id: shopId,
          status: "NOT_WORKING",
        }),
      );

      const publicAfterToggle = await runtime.createClient().request({
        path: "/api/v1/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(publicAfterToggle.status).toBe(200);
      expect(publicAfterToggle.body).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ id: shopId })]),
      );

      const ownerStorefrontResponse = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(ownerStorefrontResponse.status).toBe(200);
      expect(ownerStorefrontResponse.body).toEqual(
        expect.objectContaining({
          id: shopId,
          status: "NOT_WORKING",
        }),
      );

      const storefrontMetadataUpdate = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          name: "Toggle Bakery Deluxe",
          description: "Fresh bread after storefront edit",
          headerImageUrl: "https://example.com/header-deluxe.png",
          backgroundImageUrl: "https://example.com/background-deluxe.png",
        },
      });

      expect(storefrontMetadataUpdate.status).toBe(200);

      const statusOnlyToggleBack = await sellerClient.request({
        path: `/api/v1/seller/shops/${shopId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          status: "WORKING",
        },
      });

      expect(statusOnlyToggleBack.status).toBe(200);
      expect(statusOnlyToggleBack.body).toEqual(
        expect.objectContaining({
          id: shopId,
          name: "Toggle Bakery Deluxe",
          description: "Fresh bread after storefront edit",
          headerImageUrl: "https://example.com/header-deluxe.png",
          backgroundImageUrl: "https://example.com/background-deluxe.png",
          status: "WORKING",
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("rejects anonymous, authenticated non-seller, and foreign-seller access on protected seller routes", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const ownerProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-owner",
          telegramId: "201",
          name: "Owner Shop",
        },
      });
      const foreignProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-foreign",
          telegramId: "202",
          name: "Foreign Shop",
        },
      });

      expect(ownerProvisionResponse.status).toBe(201);
      expect(foreignProvisionResponse.status).toBe(201);
      const ownerShopId = (ownerProvisionResponse.body as { shop: { id: string } }).shop.id;

      const anonymousResponse = await runtime.createClient().request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(anonymousResponse.status).toBe(401);
      expect(anonymousResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Seller access requires an authenticated Telegram session",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });

      const nonSellerClient = runtime.createClient();
      await loginSeller(nonSellerClient, "999");

      const nonSellerResponse = await nonSellerClient.request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
      });

      expect(nonSellerResponse.status).toBe(403);
      expect(nonSellerResponse.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Seller access is not provisioned for this Telegram account",
          details: {
            telegramId: "999",
          },
        },
        trace_id: "trace-catalog-runtime",
      });

      const foreignSellerClient = runtime.createClient();
      await loginSeller(foreignSellerClient, "202");

      const foreignSellerResponse = await foreignSellerClient.request({
        path: `/api/v1/seller/shops/${ownerShopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(foreignSellerResponse.status).toBe(403);
      expect(foreignSellerResponse.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Seller cannot access this shop",
          details: {
            shopId: ownerShopId,
          },
        },
        trace_id: "trace-catalog-runtime",
      });
    } finally {
      await runtime.stop();
    }
  });

  it("returns a controlled 409 when a seller rename collides with another owned shop", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const firstShop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-rename-owner",
        name: "Rename Alpha",
      });
      const secondShop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-rename-owner",
        name: "Rename Beta",
      });
      runtime.catalogState.bindings.push(
        {
          id: "binding-rename-alpha",
          sellerId: "seller-rename-owner",
          shopId: firstShop.id,
          telegramId: "909",
        },
        {
          id: "binding-rename-beta",
          sellerId: "seller-rename-owner",
          shopId: secondShop.id,
          telegramId: "909",
        },
      );

      const sellerClient = runtime.createClient();
      await loginSeller(sellerClient, "909");

      const renameConflictResponse = await sellerClient.request({
        path: `/api/v1/seller/shops/${firstShop.id}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          name: "Rename Beta",
        },
      });

      expect(renameConflictResponse.status).toBe(409);
      expect(renameConflictResponse.body).toEqual({
        error: {
          code: "SHOP_RENAME_CONFLICT",
          message: "Shop rename conflicts with another shop owned by this seller",
        },
        trace_id: "trace-catalog-runtime",
      });

      await expect(runtime.catalogModule.repository.findShopById(firstShop.id)).resolves.toMatchObject({
        id: firstShop.id,
        sellerId: "seller-rename-owner",
        name: "Rename Alpha",
      });
      await expect(runtime.catalogModule.repository.findShopById(secondShop.id)).resolves.toMatchObject({
        id: secondShop.id,
        sellerId: "seller-rename-owner",
        name: "Rename Beta",
      });
    } finally {
      await runtime.stop();
    }
  });
});
