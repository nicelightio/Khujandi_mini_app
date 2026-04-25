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
  it("serves the checked-in admin assignment route through dev-api-server", async () => {
    const { runtime, client } = await loginAdmin();

    try {
      const response = await client.request({
        path: "/api/v1/admin/orders/order-created-1001/assignment",
        origin: adminOrigin,
        body: {
          courierId: "courier-7",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          courierId: "courier-7",
          status: "ASSIGNED",
          revision: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });
});
