import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";

const adminOrigin = "https://admin.example";

const loginAdmin = async () => {
  const runtime = await startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [adminOrigin],
  });
  runtime.prisma.state.account.login = "admin@example.com";
  runtime.prisma.state.account.role = "ADMIN";
  const client = runtime.createClient();

  const response = await client.request({
    path: "/api/v1/admin/auth/login",
    origin: adminOrigin,
    body: {
      login: "admin@example.com",
      password: "super-secret-01",
    },
  });

  expect(response.status).toBe(200);

  return {
    runtime,
    client,
  };
};

describe("delivery-assignment runtime mount", () => {
  it("keeps auto-offer default off until an operator explicitly triggers broadcast", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/auto-offers",
        origin: adminOrigin,
      });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        error: {
          code: "NO_ELIGIBLE_COURIERS",
        },
      });

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "CREATED",
          courier: expect.objectContaining({
            marker: "absent",
            current: null,
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("serves explicit auto-offer broadcast to two eligible couriers without assigning the order", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      runtime.checkoutPaymentState.users.push({
        id: "courier-9",
        telegramId: "70009",
        role: "courier",
        name: "Courier 9",
        username: "courier9",
        language: "ru",
        isActive: true,
      });
      await runtime.operationalModules.deliveryAssignmentModule.service.startCourierWork("courier-8");
      await runtime.operationalModules.deliveryAssignmentModule.service.setCourierAutoOfferParticipation(
        "courier-8",
        true,
      );
      await runtime.operationalModules.deliveryAssignmentModule.service.startCourierWork("courier-9");
      await runtime.operationalModules.deliveryAssignmentModule.service.setCourierAutoOfferParticipation(
        "courier-9",
        true,
      );

      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/auto-offers",
        origin: adminOrigin,
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          kind: "broadcast",
          status: "pending",
          orderStatus: "CREATED",
          eligibleCourierCount: 2,
          revision: expect.any(String),
          updatedAt: expect.any(String),
          offers: expect.arrayContaining([
            expect.objectContaining({
              targetCourierId: "courier-8",
              kind: "broadcast",
              status: "pending",
            }),
            expect.objectContaining({
              targetCourierId: "courier-9",
              kind: "broadcast",
              status: "pending",
            }),
          ]),
        }),
      );

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "CREATED",
          courier: expect.objectContaining({
            marker: "absent",
            current: null,
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("serves manual targeted offer creation without assigning the order", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment-offers",
        origin: adminOrigin,
        body: {
          courierId: "courier-8",
        },
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          offerId: expect.any(String),
          targetCourierId: "courier-8",
          kind: "manual",
          status: "pending",
          orderStatus: "CREATED",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "CREATED",
          courier: expect.objectContaining({
            marker: "absent",
            current: null,
          }),
        }),
      );

      const claimResult = await runtime.operationalModules.deliveryAssignmentModule.controller.claimOffer({
        offerId: String((response.body as { offerId: string }).offerId),
        courierId: "courier-8",
      });
      expect(claimResult).toEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          courierId: "courier-8",
          status: "ASSIGNED",
          revision: expect.any(String),
        }),
      );

      const claimedOrdersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(claimedOrdersResponse.status).toBe(200);
      expect(claimedOrdersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "ASSIGNED",
          courier: expect.objectContaining({
            marker: "current",
            current: expect.objectContaining({
              id: "courier-8",
            }),
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("disables the legacy normal direct assignment endpoint", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment",
        origin: adminOrigin,
        body: {
          courierId: "courier-8",
        },
      });

      expect(response.status).toBe(410);
      expect(response.body).toMatchObject({
        error: {
          code: "LEGACY_ASSIGNMENT_DISABLED",
        },
      });

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "CREATED",
          courier: expect.objectContaining({
            marker: "absent",
            current: null,
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("requires confirmation before the explicit direct assignment override", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment-override",
        origin: adminOrigin,
        body: {
          courierId: "courier-8",
        },
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: {
          code: "CONFIRMATION_REQUIRED",
        },
      });

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "CREATED",
          courier: expect.objectContaining({
            marker: "absent",
            current: null,
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("serves confirmed explicit direct assignment override", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment-override",
        origin: adminOrigin,
        body: {
          courierId: "courier-8",
          confirmDirectAssignmentOverride: true,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          courierId: "courier-8",
          status: "ASSIGNED",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "ASSIGNED",
          courier: expect.objectContaining({
            marker: "current",
            current: expect.objectContaining({
              id: "courier-8",
            }),
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });
});
