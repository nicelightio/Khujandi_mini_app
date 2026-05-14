import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";

const adminOrigin = "https://admin.example";
const testToken = "test-runtime-token";

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

describe("order-cancellation runtime mount", () => {
  it("serves the checked-in admin cancellation and refund routes through dev-api-server", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const cancellationResponse = await client.request({
        path: "/api/v1/admin/orders/order-in-progress-2004/cancellation",
        origin: adminOrigin,
        body: {
          reasonCode: "OPS_DELAY",
        },
      });

      expect(cancellationResponse.status).toBe(200);
      expect(cancellationResponse.body).toEqual(
        expect.objectContaining({
          orderId: "order-in-progress-2004",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "PENDING_MANUAL",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      const refundResponse = await client.request({
        path: "/api/v1/admin/orders/order-in-progress-2004/refund",
        origin: adminOrigin,
        body: {
          refundStatus: "DONE",
          refundNote: "Operator confirmed manual refund",
        },
      });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body).toEqual(
        expect.objectContaining({
          orderId: "order-in-progress-2004",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Operator confirmed manual refund",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });

  it("cancels and records manual refund for the seeded staging QA order by explicit id", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      allowedOrigins: [adminOrigin],
      appEnv: "staging",
      nodeEnv: "test",
      isE2eTestModeEnabled: true,
      e2eTestToken: testToken,
      paymentProvider: "mock",
    });
    const client = runtime.createClient();

    try {
      const seedResponse = await client.request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "operator_orders",
        },
      });
      expect(seedResponse.status).toBe(200);

      runtime.prisma.state.account.login = "admin@example.com";
      runtime.prisma.state.account.role = "BOSS";
      const loginResponse = await client.request({
        path: "/api/v1/admin/auth/login",
        origin: adminOrigin,
        body: {
          login: "admin@example.com",
          password: "super-secret-01",
        },
      });
      expect(loginResponse.status).toBe(200);

      const cancellationResponse = await client.request({
        path: "/api/v1/admin/orders/test-order-cancellable-3001/cancellation",
        origin: adminOrigin,
        body: {
          reasonCode: "OPS_DELAY",
        },
      });

      expect(cancellationResponse.status).toBe(200);
      expect(cancellationResponse.body).toEqual(
        expect.objectContaining({
          orderId: "test-order-cancellable-3001",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "PENDING_MANUAL",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      const refundResponse = await client.request({
        path: "/api/v1/admin/orders/test-order-cancellable-3001/refund",
        origin: adminOrigin,
        body: {
          refundStatus: "DONE",
          refundNote: "UI QA manual refund completed",
        },
      });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body).toEqual(
        expect.objectContaining({
          orderId: "test-order-cancellable-3001",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "UI QA manual refund completed",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });
});
