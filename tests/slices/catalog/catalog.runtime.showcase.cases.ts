import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { adminOrigin, loginAdmin } from "./catalog.runtime.test-helpers";

export const registerCatalogRuntimeShowcaseCases = () => {
  it("serves public showcase from live catalog references and hides not-working shop refs", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const workingShop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-showcase-working",
        name: "Showcase Working",
        primaryPublicPath: "seller-showcase-working1",
        secondaryPublicPath: "showcase-working",
        status: "WORKING",
      });
      const hiddenShop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-showcase-hidden",
        name: "Showcase Hidden",
        primaryPublicPath: "seller-showcase-hidden1",
        secondaryPublicPath: "showcase-hidden",
        status: "NOT_WORKING",
      });
      const workingProduct = await runtime.catalogModule.repository.createProduct({
        shopId: workingShop.id,
        name: "Live Showcase Product",
        description: "Resolved from product state",
        priceMinor: 1200,
      });
      const hiddenProduct = await runtime.catalogModule.repository.createProduct({
        shopId: hiddenShop.id,
        name: "Hidden Showcase Product",
        priceMinor: 1300,
      });

      await runtime.catalogModule.repository.favoriteShop(workingShop.id);
      await runtime.catalogModule.repository.favoriteShop(hiddenShop.id);
      await runtime.catalogModule.repository.addShowcaseProduct(workingProduct.record.id);
      await runtime.catalogModule.repository.addShowcaseProduct(hiddenProduct.record.id);

      const showcaseResponse = await runtime.createClient().request({
        path: "/api/v1/showcase",
        method: "GET",
        origin: adminOrigin,
      });

      expect(showcaseResponse.status).toBe(200);
      expect(showcaseResponse.body).toEqual(
        expect.objectContaining({
          favoriteShops: [
            expect.objectContaining({
              id: workingShop.id,
              name: "Showcase Working",
              publicPath: "showcase-working",
            }),
          ],
          allKhujandLink: {
            label: "весь Худжанд",
            target: "/shops",
          },
          popularTodayProducts: [
            expect.objectContaining({
              id: workingProduct.record.id,
              name: "Live Showcase Product",
              shopId: workingShop.id,
              shopPublicPath: "showcase-working",
              priceMinor: 1200,
            }),
          ],
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("enforces the 3 active favorite shops cap", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const shops = [];

      for (let index = 1; index <= 4; index += 1) {
        shops.push(await runtime.catalogModule.repository.createShop({
          sellerId: `seller-favorite-${index}`,
          name: `Favorite Shop ${index}`,
          primaryPublicPath: `seller-favorite-${index}1`,
          secondaryPublicPath: `favorite-shop-${index}`,
          status: "WORKING",
        }));
      }

      await runtime.catalogModule.repository.favoriteShop(shops[0].id);
      await runtime.catalogModule.repository.favoriteShop(shops[1].id);
      await runtime.catalogModule.repository.favoriteShop(shops[2].id);

      await expect(runtime.catalogModule.repository.favoriteShop(shops[3].id)).rejects.toMatchObject({
        code: "SHOWCASE_FAVORITE_LIMIT",
        statusCode: 409,
      });
    } finally {
      await runtime.stop();
    }
  });

  it("does not let hidden favorite shops consume the public favorite cap", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      for (let index = 1; index <= 3; index += 1) {
        const hiddenShop = await runtime.catalogModule.repository.createShop({
          sellerId: `seller-hidden-favorite-${index}`,
          name: `Hidden Favorite ${index}`,
          primaryPublicPath: `seller-hidden-favorite-${index}1`,
          secondaryPublicPath: `hidden-favorite-${index}`,
          status: "NOT_WORKING",
        });

        await runtime.catalogModule.repository.favoriteShop(hiddenShop.id);
      }

      const workingShop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-visible-favorite",
        name: "Visible Favorite",
        primaryPublicPath: "seller-visible-favorite1",
        secondaryPublicPath: "visible-favorite",
        status: "WORKING",
      });

      await expect(runtime.catalogModule.repository.favoriteShop(workingShop.id)).resolves.toBeUndefined();

      const showcaseResponse = await runtime.createClient().request({
        path: "/api/v1/showcase",
        method: "GET",
        origin: adminOrigin,
      });

      expect(showcaseResponse.status).toBe(200);
      expect(showcaseResponse.body).toEqual(
        expect.objectContaining({
          favoriteShops: [
            expect.objectContaining({
              id: workingShop.id,
              name: "Visible Favorite",
            }),
          ],
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("allows browser preflight for DELETE showcase curation endpoints", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const client = runtime.createClient();
      const productPreflight = await client.request({
        path: "/api/v1/admin/catalog/showcase/products/product-preflight",
        method: "OPTIONS",
        origin: adminOrigin,
        headers: {
          "access-control-request-method": "DELETE",
        },
      });
      const shopPreflight = await client.request({
        path: "/api/v1/admin/catalog/showcase/shops/shop-preflight",
        method: "OPTIONS",
        origin: adminOrigin,
        headers: {
          "access-control-request-method": "DELETE",
        },
      });

      expect(productPreflight.status).toBe(204);
      expect(productPreflight.headers["access-control-allow-methods"]).toContain("DELETE");
      expect(shopPreflight.status).toBe(204);
      expect(shopPreflight.headers["access-control-allow-methods"]).toContain("DELETE");
    } finally {
      await runtime.stop();
    }
  });

  it("requires BOSS or ADMIN admin session before showcase writes", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const shop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-showcase-rbac",
        name: "Showcase RBAC",
        primaryPublicPath: "seller-showcase-rbac1",
        secondaryPublicPath: "showcase-rbac",
        status: "WORKING",
      });

      const anonymousResponse = await runtime.createClient().request({
        path: `/api/v1/admin/catalog/showcase/shops/${shop.id}`,
        origin: adminOrigin,
      });

      expect(anonymousResponse.status).toBe(401);
      expect(runtime.catalogState.favoriteShops).toHaveLength(0);

      runtime.prisma.state.account.role = "MANAGER";
      const managerClient = runtime.createClient();
      await loginAdmin(managerClient);

      const managerResponse = await managerClient.request({
        path: `/api/v1/admin/catalog/showcase/shops/${shop.id}`,
        origin: adminOrigin,
      });

      expect(managerResponse.status).toBe(403);
      expect(runtime.catalogState.favoriteShops).toHaveLength(0);

      runtime.prisma.state.account.role = "ADMIN";
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const adminResponse = await adminClient.request({
        path: `/api/v1/admin/catalog/showcase/shops/${shop.id}`,
        origin: adminOrigin,
      });

      expect(adminResponse.status).toBe(200);
      expect(runtime.catalogState.favoriteShops).toEqual([
        expect.objectContaining({
          shopId: shop.id,
          isActive: true,
        }),
      ]);
    } finally {
      await runtime.stop();
    }
  });

  it("unlinks showcase products without deleting the underlying product", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const shop = await runtime.catalogModule.repository.createShop({
        sellerId: "seller-showcase-unlink",
        name: "Showcase Unlink",
        primaryPublicPath: "seller-showcase-unlink1",
        secondaryPublicPath: "showcase-unlink",
        status: "WORKING",
      });
      const product = await runtime.catalogModule.repository.createProduct({
        shopId: shop.id,
        name: "Unlink Only Product",
        priceMinor: 1400,
      });
      const adminClient = runtime.createClient();
      await loginAdmin(adminClient);

      const addResponse = await adminClient.request({
        path: `/api/v1/admin/catalog/showcase/products/${product.record.id}`,
        origin: adminOrigin,
      });

      expect(addResponse.status).toBe(200);

      const unlinkResponse = await adminClient.request({
        path: `/api/v1/admin/catalog/showcase/products/${product.record.id}`,
        method: "DELETE",
        origin: adminOrigin,
      });

      expect(unlinkResponse.status).toBe(200);
      await expect(runtime.catalogModule.repository.findProductById(product.record.id)).resolves.toEqual(
        expect.objectContaining({
          id: product.record.id,
          isDeleted: false,
          name: "Unlink Only Product",
        }),
      );
      expect(runtime.catalogState.showcaseProducts).toEqual([
        expect.objectContaining({
          productId: product.record.id,
          isActive: false,
        }),
      ]);
    } finally {
      await runtime.stop();
    }
  });
};
