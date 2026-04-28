import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { InMemoryCatalogRepository, createCatalogRuntimeState } from "../../../backend/src/dev-runtime/catalog-runtime";
import { adminOrigin, createTelegramInitData } from "./catalog.runtime.test-helpers";

export const registerCatalogRuntimeMiscCases = () => {
  it("returns the canonical error contract for missing dev-api routes", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const client = runtime.createClient();
      const response = await client.request({
        path: "/api/v1/unknown-route",
        method: "GET",
        origin: adminOrigin,
      });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Route not found.",
        },
        trace_id: "trace-dev-runtime",
      });
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

  it("fails closed on malformed protected Mini App cookies instead of returning an uncontrolled 500", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/seller/shops",
        method: "GET",
        origin: adminOrigin,
        headers: {
          cookie: "khujandi_mini_app_session=%E0%A4%A",
        },
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: {
          code: "AUTH_REQUIRED",
        },
      });
    } finally {
      await runtime.stop();
    }
  });

  it("rejects oversized JSON bodies through the controlled error contract", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
    });

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: "x".repeat(1024 * 1024),
        },
      });

      expect(response.status).toBe(413);
      expect(response.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
          details: {
            maxBytes: 1024 * 1024,
          },
        },
      });
    } finally {
      await runtime.stop();
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
};
