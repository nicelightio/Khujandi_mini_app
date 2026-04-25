import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { adminOrigin, loginAdmin, loginSeller } from "./catalog.runtime.test-helpers";

export const registerCatalogRuntimeSellerCases = () => {
  it("serves the canonical public storefront payload from the same persisted shop model for both public path aliases", async () => {
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
          sellerId: "seller-public-runtime",
          telegramId: "901",
          name: "Public Runtime Bakery",
          description: "Canonical public storefront payload",
          headerImageUrl: "https://example.com/header-public.png",
          backgroundImageUrl: "https://example.com/background-public.png",
          status: "WORKING",
        },
      });

      expect(provisionResponse.status).toBe(201);

      const provisionedBody = provisionResponse.body as {
        shop: {
          primaryPublicPath: string;
          secondaryPublicPath: string;
        };
      };

      const primaryResponse = await runtime.createClient().request({
        path: `/api/v1/shops/${provisionedBody.shop.primaryPublicPath}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(primaryResponse.status).toBe(200);
      expect(primaryResponse.body).toEqual(
        expect.objectContaining({
          shop: expect.objectContaining({
            name: "Public Runtime Bakery",
            publicPath: provisionedBody.shop.secondaryPublicPath,
            description: "Canonical public storefront payload",
            headerImageUrl: "https://example.com/header-public.png",
            backgroundImageUrl: "https://example.com/background-public.png",
          }),
          menuPages: expect.arrayContaining([
            expect.objectContaining({
              name: "Popular",
              products: expect.arrayContaining([
                expect.objectContaining({
                  name: "Starter Dish",
                  description: "Edit this product after admin provisioning.",
                  imageUrl: null,
                }),
              ]),
            }),
          ]),
        }),
      );

      const secondaryResponse = await runtime.createClient().request({
        path: `/api/v1/shops/${provisionedBody.shop.secondaryPublicPath}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(secondaryResponse.status).toBe(200);
      expect(secondaryResponse.body).toEqual(primaryResponse.body);
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

  it("keeps canonical seller endpoints fail-closed even when debug mode is enabled", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      isDebugEnabled: true,
    });

    try {
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const ownerProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-debug-owner",
          telegramId: "301",
          name: "Debug Owner Shop",
        },
      });
      const foreignProvisionResponse = await adminClient.request({
        path: "/api/v1/admin/catalog/shops/provision",
        origin: adminOrigin,
        body: {
          sellerId: "seller-debug-foreign",
          telegramId: "302",
          name: "Debug Foreign Shop",
        },
      });

      expect(ownerProvisionResponse.status).toBe(201);
      expect(foreignProvisionResponse.status).toBe(201);

      const ownerShopId = (ownerProvisionResponse.body as { shop: { id: string } }).shop.id;

      const anonymousReadResponse = await runtime.createClient().request({
        path: `/api/v1/seller/shops/${ownerShopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(anonymousReadResponse.status).toBe(401);
      expect(anonymousReadResponse.body).toEqual({
        error: {
          code: "AUTH_REQUIRED",
          message: "Seller access requires an authenticated Telegram session",
          details: undefined,
        },
        trace_id: "trace-catalog-runtime",
      });

      const foreignSellerClient = runtime.createClient();
      await loginSeller(foreignSellerClient, "302");

      const foreignReadResponse = await foreignSellerClient.request({
        path: `/api/v1/seller/shops/${ownerShopId}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(foreignReadResponse.status).toBe(403);
      expect(foreignReadResponse.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Seller cannot access this shop",
          details: {
            shopId: ownerShopId,
          },
        },
        trace_id: "trace-catalog-runtime",
      });

      const foreignWriteResponse = await foreignSellerClient.request({
        path: `/api/v1/seller/shops/${ownerShopId}`,
        method: "PUT",
        origin: adminOrigin,
        body: {
          name: "Hijacked In Debug",
        },
      });

      expect(foreignWriteResponse.status).toBe(403);
      expect(foreignWriteResponse.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Seller cannot access this shop",
          details: {
            shopId: ownerShopId,
          },
        },
        trace_id: "trace-catalog-runtime",
      });

      await expect(runtime.catalogModule.repository.findShopById(ownerShopId)).resolves.toMatchObject({
        id: ownerShopId,
        name: "Debug Owner Shop",
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
};
