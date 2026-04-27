import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import type { RuntimeCookieSessionClient } from "../../../backend/src/dev-runtime/http-runtime";
import { adminOrigin, createTelegramInitData } from "../catalog/catalog.runtime.test-helpers";

const composition = {
  shop_public_path: "seller-runtime-11",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 1,
      display_snapshot: {
        product_name: "Плов зарвода",
        unit_price_minor: 4500,
        currency: "TJS",
      },
    },
  ],
  preview_total: {
    amount_minor: 4500,
    currency: "TJS",
  },
  created_at: "2026-04-26T00:00:00.000Z",
};

const authenticateMiniAppClient = async (
  runtime: Awaited<ReturnType<typeof startDevApiServer>>,
  telegramId: string,
) => {
  const client = runtime.createClient();
  const authResponse = await client.request({
    path: "/api/v1/auth/telegram",
    origin: adminOrigin,
    body: {
      initData: createTelegramInitData({
        authDate: Math.floor(Date.now() / 1000),
        telegramId,
        firstName: "Tracking",
        lastName: "Client",
        username: `tracking_${telegramId}`,
      }),
    },
  });

  expect(authResponse.status).toBe(200);
  return client;
};

const checkoutOrder = async (client: RuntimeCookieSessionClient) => {
  const checkoutResponse = await client.request({
    path: "/api/v1/orders/checkout",
    origin: adminOrigin,
    body: {
      composition,
    },
  });

  expect(checkoutResponse.status).toBe(200);
  return checkoutResponse.body as { orderId: string; revision: string };
};

const loginAdmin = async (runtime: Awaited<ReturnType<typeof startDevApiServer>>) => {
  runtime.prisma.state.account.login = "admin@example.com";
  runtime.prisma.state.account.role = "ADMIN";
  const client = runtime.createClient();
  const loginResponse = await client.request({
    path: "/api/v1/admin/auth/login",
    origin: adminOrigin,
    body: {
      login: "admin@example.com",
      password: "super-secret-01",
    },
  });

  expect(loginResponse.status).toBe(200);
  return client;
};

describe("delivery-tracking mounted runtime events", () => {
  it("mounts customer GET /api/v1/events and filters unrelated order events", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
    });

    try {
      const customerOne = await authenticateMiniAppClient(runtime, "701401");
      const customerTwo = await authenticateMiniAppClient(runtime, "701402");
      const orderOne = await checkoutOrder(customerOne);
      const orderTwo = await checkoutOrder(customerTwo);

      expect(orderOne.revision).toBe("0");
      expect(orderOne.revision).not.toBe(orderOne.orderId);

      const admin = await loginAdmin(runtime);
      await expect(
        admin.request({
          path: `/api/v1/admin/orders/${orderOne.orderId}/assignment`,
          origin: adminOrigin,
          body: {
            courierId: "courier-7",
          },
        }),
      ).resolves.toMatchObject({ status: 200 });
      await expect(
        admin.request({
          path: `/api/v1/admin/orders/${orderTwo.orderId}/assignment`,
          origin: adminOrigin,
          body: {
            courierId: "courier-8",
          },
        }),
      ).resolves.toMatchObject({ status: 200 });

      const eventResponse = await customerOne.request({
        path: `/api/v1/events?since=${encodeURIComponent(orderOne.revision)}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(eventResponse.status).toBe(200);
      expect(eventResponse.body).toEqual({
        events: [
          expect.objectContaining({
            type: "order.assigned",
            entity: "order",
            entityId: orderOne.orderId,
            revision: "1",
            payload: expect.objectContaining({
              orderId: orderOne.orderId,
              status: "ASSIGNED",
              courierId: "courier-7",
            }),
          }),
        ],
        next_cursor: "2",
      });
    } finally {
      await runtime.stop();
    }
  });

  it("keeps empty windows stable and accepts opaque non-numeric cursors without leaking events", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
    });

    try {
      const anonymousClient = runtime.createClient();
      const anonymousResponse = await anonymousClient.request({
        path: "/api/v1/events?since=0",
        method: "GET",
        origin: adminOrigin,
      });

      expect(anonymousResponse.status).toBe(401);

      const customer = await authenticateMiniAppClient(runtime, "701403");
      const response = await customer.request({
        path: "/api/v1/events?since=paid%3Aorder-runtime-1%3Arev-A",
        method: "GET",
        origin: adminOrigin,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        events: [],
        next_cursor: "paid:order-runtime-1:rev-A",
      });
    } finally {
      await runtime.stop();
    }
  });
});
