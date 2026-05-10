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

const loginAdmin = async (
  runtime: Awaited<ReturnType<typeof startDevApiServer>>,
  role: "ADMIN" | "BOSS" | "MANAGER" = "ADMIN",
) => {
  runtime.prisma.state.account.login = "admin@example.com";
  runtime.prisma.state.account.role = role;
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

const ensureRuntimeCourier = async (
  runtime: Awaited<ReturnType<typeof startDevApiServer>>,
  courier: {
    id: string;
    telegramId: string;
    name: string;
    username: string;
  },
) => {
  if (!runtime.checkoutPaymentState.users.some((user) => user.id === courier.id)) {
    runtime.checkoutPaymentState.users.push({
      id: courier.id,
      telegramId: courier.telegramId,
      role: "courier",
      name: courier.name,
      username: courier.username,
      language: "ru",
      isActive: true,
    });
  }

  await runtime.operationalModules.deliveryAssignmentModule.service.startCourierWork(courier.id);
};

const assignOrderThroughOfferClaim = async (
  runtime: Awaited<ReturnType<typeof startDevApiServer>>,
  admin: RuntimeCookieSessionClient,
  input: {
    orderId: string;
    courierId: string;
  },
) => {
  const offerResponse = await admin.request({
    path: `/api/v1/admin/orders/${input.orderId}/assignment-offers`,
    origin: adminOrigin,
    body: {
      courierId: input.courierId,
    },
  });

  expect(offerResponse.status).toBe(201);

  return runtime.operationalModules.deliveryAssignmentModule.controller.claimOffer({
    offerId: String((offerResponse.body as { offerId: string }).offerId),
    courierId: input.courierId,
  });
};

describe("delivery-tracking mounted runtime events", () => {
  it("serves the admin-protected operator delivery read model without changing existing operations", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
      now: () => new Date("2026-05-09T12:00:00.000Z"),
    });

    try {
      runtime.checkoutPaymentState.orders.push(
        {
          id: "order-delayed-3001",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Delayed Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: null,
          status: "DELAYED",
          itemsTotalMinor: 9000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 10500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-delayed-3001",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
        {
          id: "order-picked-up-3002",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Picked Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: "courier-8",
          status: "PICKED_UP",
          itemsTotalMinor: 11000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 12500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-picked-up-3002",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
        {
          id: "order-delivered-3003",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Delivered Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: "courier-8",
          status: "DELIVERED",
          itemsTotalMinor: 14000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 15500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-delivered-3003",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
      );

      const anonymousClient = runtime.createClient();
      await expect(
        anonymousClient.request({
          path: "/api/v1/admin/operator/delivery/orders",
          method: "GET",
          origin: adminOrigin,
        }),
      ).resolves.toMatchObject({ status: 401 });

      const admin = await loginAdmin(runtime);
      const statusResponse = await admin.request({
        path: "/api/v1/admin/operator/delivery/orders/order-delivered-3003/status",
        origin: adminOrigin,
        body: {
          nextStatus: "COMPLETED",
        },
      });
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toMatchObject({
        orderId: "order-delivered-3003",
        status: "COMPLETED",
        revision: expect.any(String),
      });

      const invalidStatusResponse = await admin.request({
        path: "/api/v1/admin/operator/delivery/orders/order-picked-up-3002/status",
        origin: adminOrigin,
        body: {
          nextStatus: "COMPLETED",
        },
      });
      expect(invalidStatusResponse.status).toBe(409);

      await ensureRuntimeCourier(runtime, {
        id: "courier-9",
        telegramId: "70009",
        name: "Courier 9",
        username: "courier9",
      });
      await expect(
        assignOrderThroughOfferClaim(runtime, admin, {
          orderId: "order-created-1001",
          courierId: "courier-9",
        }),
      ).resolves.toMatchObject({
        orderId: "order-created-1001",
        courierId: "courier-9",
        status: "ASSIGNED",
      });

      const cancellationResponse = await admin.request({
        path: "/api/v1/admin/orders/order-in-progress-2004/cancellation",
        origin: adminOrigin,
        body: {
          reasonCode: "OPS_DELAY",
        },
      });
      expect(cancellationResponse.status).toBe(200);

      const refundResponse = await admin.request({
        path: "/api/v1/admin/orders/order-in-progress-2004/refund",
        origin: adminOrigin,
        body: {
          refundStatus: "DONE",
          refundNote: "Operator confirmed manual refund",
        },
      });
      expect(refundResponse.status).toBe(200);

      const readResponse = await admin.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });

      expect(readResponse.status).toBe(200);
      expect(readResponse.body).toEqual(
        expect.objectContaining({
          window: {
            from: "2026-05-05T19:00:00.000Z",
            to: "2026-05-09T12:00:00.000Z",
          },
          generatedAt: "2026-05-09T12:00:00.000Z",
          revision: expect.any(String),
          orders: expect.any(Array),
        }),
      );

      const rows = (readResponse.body as { orders: Array<Record<string, unknown>> }).orders;
      const assignedRow = rows.find((row) => row.orderId === "order-created-1001");
      const cancelledRow = rows.find((row) => row.orderId === "order-in-progress-2004");
      const delayedRow = rows.find((row) => row.orderId === "order-delayed-3001");
      const pickedUpRow = rows.find((row) => row.orderId === "order-picked-up-3002");
      const completedRow = rows.find((row) => row.orderId === "order-delivered-3003");

      expect(assignedRow).toEqual(
        expect.objectContaining({
          status: "ASSIGNED",
          severity: "active_under_30",
          assignedAt: "2026-05-09T12:00:00.000Z",
          claimedAt: "2026-05-09T12:00:00.000Z",
          latestMessage: null,
          latestMessagePreview: null,
          latestMessageSenderRole: null,
          courier: {
            marker: "current",
            current: {
              id: "courier-9",
              name: "Courier 9",
              telegramId: "70009",
            },
          },
        }),
      );
      expect(assignedRow?.history).toEqual([
        expect.objectContaining({
          status: "ASSIGNED",
          previousStatus: "CREATED",
          actor: expect.objectContaining({
            userId: "courier-9",
            role: "courier",
          }),
        }),
      ]);
      expect(cancelledRow).toEqual(
        expect.objectContaining({
          status: "CANCELLED_BY_ADMIN",
          severity: "cancelled",
        }),
      );
      expect(delayedRow).toEqual(
        expect.objectContaining({
          status: "DELAYED",
          severity: "delayed",
          courier: {
            marker: "absent",
            current: null,
          },
        }),
      );
      expect(pickedUpRow).toEqual(
        expect.objectContaining({
          status: "PICKED_UP",
          courier: expect.objectContaining({
            marker: "current",
          }),
        }),
      );
      expect(completedRow).toEqual(
        expect.objectContaining({
          status: "COMPLETED",
          severity: "completed",
        }),
      );
      expect(completedRow?.history).toEqual([
        expect.objectContaining({
          status: "COMPLETED",
          previousStatus: "DELIVERED",
          actor: {
            userId: "admin-account-1",
            role: "admin",
            name: "admin-account-1",
          },
        }),
      ]);
    } finally {
      await runtime.stop();
    }
  });

  it("normalizes authenticated manager into operator status command capability only", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
      now: () => new Date("2026-05-09T12:00:00.000Z"),
    });

    try {
      runtime.checkoutPaymentState.orders.push(
        {
          id: "order-delivered-manager-3010",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Manager Delivered Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: "courier-8",
          status: "DELIVERED",
          itemsTotalMinor: 14000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 15500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-delivered-manager-3010",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
        {
          id: "order-picked-up-manager-3011",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Manager Picked Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: "courier-8",
          status: "PICKED_UP",
          itemsTotalMinor: 14000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 15500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-picked-up-manager-3011",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
        {
          id: "order-delivered-boss-3012",
          shopId: "shop-demo-1",
          shopNameSnapshot: "Boss Delivered Shop",
          sellerId: "seller-demo-1",
          clientId: "client-demo-1",
          courierId: "courier-8",
          status: "DELIVERED",
          itemsTotalMinor: 14000,
          deliveryFeeMinor: 1500,
          totalAmountMinor: 15500,
          paymentProvider: "demo-provider",
          paymentProviderTxId: "demo-payment-delivered-boss-3012",
          telegramPaymentChargeId: null,
          providerPaymentChargeId: null,
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          isDeleted: false,
        },
      );

      const manager = await loginAdmin(runtime, "MANAGER");
      const managerStatusResponse = await manager.request({
        path: "/api/v1/admin/operator/delivery/orders/order-delivered-manager-3010/status",
        origin: adminOrigin,
        body: {
          nextStatus: "COMPLETED",
        },
      });

      expect(managerStatusResponse.status).toBe(200);
      expect(managerStatusResponse.body).toMatchObject({
        orderId: "order-delivered-manager-3010",
        status: "COMPLETED",
        revision: expect.any(String),
      });

      const invalidStatusResponse = await manager.request({
        path: "/api/v1/admin/operator/delivery/orders/order-picked-up-manager-3011/status",
        origin: adminOrigin,
        body: {
          nextStatus: "COMPLETED",
        },
      });

      expect(invalidStatusResponse.status).toBe(409);

      const readResponse = await manager.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(readResponse.status).toBe(200);
      const rows = (readResponse.body as { orders: Array<Record<string, unknown>> }).orders;
      const completedRow = rows.find((row) => row.orderId === "order-delivered-manager-3010");
      expect(completedRow?.history).toEqual([
        expect.objectContaining({
          status: "COMPLETED",
          previousStatus: "DELIVERED",
          actor: {
            userId: "admin-account-1",
            role: "operator",
            name: "admin-account-1",
          },
        }),
      ]);

      const boss = await loginAdmin(runtime, "BOSS");
      const bossStatusResponse = await boss.request({
        path: "/api/v1/admin/operator/delivery/orders/order-delivered-boss-3012/status",
        origin: adminOrigin,
        body: {
          nextStatus: "COMPLETED",
        },
      });

      expect(bossStatusResponse.status).toBe(403);
      expect(runtime.checkoutPaymentState.orders.find((order) => order.id === "order-delivered-boss-3012")?.status).toBe(
        "DELIVERED",
      );
    } finally {
      await runtime.stop();
    }
  });

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
      await ensureRuntimeCourier(runtime, {
        id: "courier-9",
        telegramId: "70009",
        name: "Courier 9",
        username: "courier9",
      });
      await ensureRuntimeCourier(runtime, {
        id: "courier-10",
        telegramId: "70010",
        name: "Courier 10",
        username: "courier10",
      });
      await expect(
        assignOrderThroughOfferClaim(runtime, admin, {
          orderId: orderOne.orderId,
          courierId: "courier-9",
        }),
      ).resolves.toMatchObject({
        orderId: orderOne.orderId,
        courierId: "courier-9",
        status: "ASSIGNED",
      });
      await expect(
        assignOrderThroughOfferClaim(runtime, admin, {
          orderId: orderTwo.orderId,
          courierId: "courier-10",
        }),
      ).resolves.toMatchObject({
        orderId: orderTwo.orderId,
        courierId: "courier-10",
        status: "ASSIGNED",
      });

      const eventResponse = await customerOne.request({
        path: `/api/v1/events?since=${encodeURIComponent(orderOne.revision)}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(eventResponse.status).toBe(200);
      const events = (eventResponse.body as { events: Array<{ entityId: string; type: string }> }).events;
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "order.offer_created",
            entity: "order",
            entityId: orderOne.orderId,
          }),
          expect.objectContaining({
            type: "order.assigned",
            entity: "order",
            entityId: orderOne.orderId,
            payload: expect.objectContaining({
              orderId: orderOne.orderId,
              status: "ASSIGNED",
              courierId: "courier-9",
            }),
          }),
        ]),
      );
      expect(events.some((event) => event.entityId === orderTwo.orderId)).toBe(false);
      expect(eventResponse.body).toEqual(
        expect.objectContaining({
          next_cursor: "4",
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("maps timeout-created order.delayed events from mounted customer polling", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
    });

    try {
      const customer = await authenticateMiniAppClient(runtime, "701405");
      const order = await checkoutOrder(customer);
      await ensureRuntimeCourier(runtime, {
        id: "courier-timeout-1",
        telegramId: "70901",
        name: "Courier Timeout",
        username: "courier_timeout",
      });

      await runtime.operationalModules.deliveryAssignmentModule.service.createManualOffer(
        {
          orderId: order.orderId,
          courierId: "courier-timeout-1",
          actor: {
            userId: "admin-account-1",
            role: "admin",
          },
        },
        new Date("2026-05-09T12:00:00.000Z"),
      );

      await expect(
        runtime.operationalModules.deliveryAssignmentModule.controller.evaluateOfferTimeouts(
          new Date("2026-05-09T12:06:10.000Z"),
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          expiredOfferCount: 1,
          delayedOrderCount: 1,
        }),
      );

      const eventResponse = await customer.request({
        path: `/api/v1/events?since=${encodeURIComponent(order.revision)}`,
        method: "GET",
        origin: adminOrigin,
      });

      expect(eventResponse.status).toBe(200);
      const events = (eventResponse.body as {
        events: Array<{ entityId: string; type: string; payload: { previousStatus?: string; status?: string } }>;
      }).events;
      expect(events).toContainEqual(
        expect.objectContaining({
          type: "order.delayed",
          entityId: order.orderId,
          payload: expect.objectContaining({
            previousStatus: "CREATED",
            status: "DELAYED",
          }),
        }),
      );
      expect(events.some((event) => event.type === "order.delayed" && event.payload.status === undefined)).toBe(false);
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
