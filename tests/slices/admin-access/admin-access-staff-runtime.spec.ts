import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";

const adminOrigin = "https://admin.example";

const loginStaffRuntime = async (role: "ADMIN" | "BOSS" | "OPERATOR" = "ADMIN") => {
  const runtime = await startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [adminOrigin],
    now: () => new Date("2026-05-14T09:00:00.000Z"),
  });
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

  return {
    runtime,
    client,
  };
};

describe("admin Staff panel runtime routes", () => {
  it("rejects operator access with the canonical error shape", async () => {
    const { runtime, client } = await loginStaffRuntime("OPERATOR");

    try {
      const response = await client.request({
        path: "/api/v1/admin/staff/couriers",
        method: "GET",
        origin: adminOrigin,
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Staff panel requires admin or boss access",
          details: {
            role: "operator",
          },
        },
        trace_id: "trace-admin-staff-runtime",
      });
    } finally {
      await runtime.stop();
    }
  });

  it("creates separate courier/operator resources and forbids ADMIN creation through operator API", async () => {
    const { runtime, client } = await loginStaffRuntime("ADMIN");

    try {
      const courierResponse = await client.request({
        path: "/api/v1/admin/staff/couriers",
        origin: adminOrigin,
        body: {
          telegram_user_id: "99001",
          nickname: "Courier Runtime",
        },
      });
      expect(courierResponse.status).toBe(201);
      expect(courierResponse.body).toEqual({
        courier: expect.objectContaining({
          telegramId: "99001",
          nickname: "Courier Runtime",
          role: "courier",
        }),
      });
      expect(JSON.stringify(courierResponse.body)).not.toContain("password");

      const roleRefusal = await client.request({
        path: "/api/v1/admin/staff/operators",
        origin: adminOrigin,
        body: {
          email: "bad-admin@example.com",
          nickname: "Bad Admin",
          password: "strong-password-01",
          role: "admin",
        },
      });
      expect(roleRefusal.status).toBe(400);
      expect(roleRefusal.body).toMatchObject({
        error: {
          code: "INVALID_OPERATOR_ROLE",
        },
      });

      const operatorResponse = await client.request({
        path: "/api/v1/admin/staff/operators",
        origin: adminOrigin,
        body: {
          email: "operator-runtime@example.com",
          nickname: "Operator Runtime",
          password: "strong-password-01",
          role: "operator",
        },
      });
      expect(operatorResponse.status).toBe(201);
      expect(operatorResponse.body).toEqual({
        operator: expect.objectContaining({
          login: "operator-runtime@example.com",
          nickname: "Operator Runtime",
          role: "operator",
        }),
        oneTimePassword: "strong-password-01",
      });
      expect(runtime.prisma.state.operatorAccounts).toHaveLength(1);
      expect(runtime.prisma.state.operatorAccounts[0]?.role).toBe("OPERATOR");
      expect(runtime.prisma.state.operatorAccounts[0]?.passwordHash).not.toBe("strong-password-01");

      const couriersList = await client.request({
        path: "/api/v1/admin/staff/couriers",
        method: "GET",
        origin: adminOrigin,
      });
      const operatorsList = await client.request({
        path: "/api/v1/admin/staff/operators",
        method: "GET",
        origin: adminOrigin,
      });

      expect(couriersList.status).toBe(200);
      expect(couriersList.body).toEqual({
        couriers: expect.arrayContaining([
          expect.objectContaining({
            telegramUserId: "99001",
            activeStatus: "active",
            deliveredOrdersCount: expect.any(Number),
            courierOrderRating: expect.any(Number),
          }),
        ]),
      });
      expect(operatorsList.status).toBe(200);
      expect(operatorsList.body).toEqual({
        operators: [
          expect.objectContaining({
            email: "operator-runtime@example.com",
            activeStatus: "active",
            processedOrdersCount: expect.any(Number),
            operatorRating: expect.any(Number),
          }),
        ],
      });
    } finally {
      await runtime.stop();
    }
  });

  it("authenticates Staff-created operators and boss-reset operator passwords", async () => {
    const { runtime, client: bossClient } = await loginStaffRuntime("BOSS");

    try {
      const operatorResponse = await bossClient.request({
        path: "/api/v1/admin/staff/operators",
        origin: adminOrigin,
        body: {
          email: "operator-login-runtime@example.com",
          nickname: "Operator Login Runtime",
          password: "strong-password-01",
        },
      });
      expect(operatorResponse.status).toBe(201);
      expect(operatorResponse.body).toEqual({
        operator: expect.objectContaining({
          login: "operator-login-runtime@example.com",
          nickname: "Operator Login Runtime",
          role: "operator",
        }),
        oneTimePassword: "strong-password-01",
      });
      expect(JSON.stringify(operatorResponse.body)).not.toContain("passwordHash");

      const operatorAdminAccountId = String(
        (operatorResponse.body as { operator: { id: string } }).operator.id,
      );
      const createdOperator = runtime.prisma.state.operatorAccounts.find(
        (account) => account.id === operatorAdminAccountId,
      );

      expect(createdOperator?.passwordHash).toMatch(/^[a-f0-9]{64}$/u);
      expect(createdOperator?.passwordHash).not.toBe("strong-password-01");

      const operatorClient = runtime.createClient();
      const operatorLoginResponse = await operatorClient.request({
        path: "/api/v1/admin/auth/login",
        origin: adminOrigin,
        body: {
          login: "operator-login-runtime@example.com",
          password: "strong-password-01",
        },
      });

      expect(operatorLoginResponse.status).toBe(200);
      expect(operatorLoginResponse.body).toEqual({
        session: expect.objectContaining({
          adminAccountId: operatorAdminAccountId,
          role: "operator",
        }),
      });

      const operatorStaffResponse = await operatorClient.request({
        path: "/api/v1/admin/staff/operators",
        method: "GET",
        origin: adminOrigin,
      });

      expect(operatorStaffResponse.status).toBe(403);
      expect(operatorStaffResponse.body).toMatchObject({
        error: {
          code: "FORBIDDEN",
        },
      });

      const resetResponse = await bossClient.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/password-reset`,
        origin: adminOrigin,
        body: {
          password: "reset-password-01",
        },
      });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body).toEqual({
        operator: expect.objectContaining({
          id: operatorAdminAccountId,
          login: "operator-login-runtime@example.com",
        }),
        revokedSessionCount: 1,
        oneTimePassword: "reset-password-01",
      });
      expect(JSON.stringify(resetResponse.body)).not.toContain("passwordHash");

      const resetOperator = runtime.prisma.state.operatorAccounts.find(
        (account) => account.id === operatorAdminAccountId,
      );
      expect(resetOperator?.passwordHash).toMatch(/^[a-f0-9]{64}$/u);
      expect(resetOperator?.passwordHash).not.toBe("strong-password-01");
      expect(resetOperator?.passwordHash).not.toBe("reset-password-01");

      const oldPasswordClient = runtime.createClient();
      const oldPasswordLoginResponse = await oldPasswordClient.request({
        path: "/api/v1/admin/auth/login",
        origin: adminOrigin,
        body: {
          login: "operator-login-runtime@example.com",
          password: "strong-password-01",
        },
      });

      expect(oldPasswordLoginResponse.status).toBe(401);
      expect(oldPasswordLoginResponse.body).toMatchObject({
        error: {
          code: "INVALID_CREDENTIALS",
        },
      });

      const resetPasswordClient = runtime.createClient();
      const resetPasswordLoginResponse = await resetPasswordClient.request({
        path: "/api/v1/admin/auth/login",
        origin: adminOrigin,
        body: {
          login: "operator-login-runtime@example.com",
          password: "reset-password-01",
        },
      });

      expect(resetPasswordLoginResponse.status).toBe(200);
      expect(resetPasswordLoginResponse.body).toEqual({
        session: expect.objectContaining({
          adminAccountId: operatorAdminAccountId,
          role: "operator",
        }),
      });
    } finally {
      await runtime.stop();
    }
  });

  it("hides deactivated staff from admin default lists and allows boss archive/reactivation", async () => {
    const { runtime, client } = await loginStaffRuntime("ADMIN");

    try {
      const courierResponse = await client.request({
        path: "/api/v1/admin/staff/couriers",
        origin: adminOrigin,
        body: {
          telegram_user_id: "99002",
          nickname: "Courier Archive",
        },
      });
      const operatorResponse = await client.request({
        path: "/api/v1/admin/staff/operators",
        origin: adminOrigin,
        body: {
          email: "operator-archive@example.com",
          nickname: "Operator Archive",
          password: "strong-password-01",
        },
      });
      const courierUserId = String((courierResponse.body as { courier: { id: string } }).courier.id);
      const operatorAdminAccountId = String(
        (operatorResponse.body as { operator: { id: string } }).operator.id,
      );

      expect(courierResponse.status).toBe(201);
      expect(operatorResponse.status).toBe(201);

      const courierDeactivate = await client.request({
        path: `/api/v1/admin/staff/couriers/${courierUserId}/deactivate`,
        origin: adminOrigin,
        body: {
          reason: "no shifts",
        },
      });
      const operatorDeactivate = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/deactivate`,
        origin: adminOrigin,
        body: {
          reason: "no shifts",
        },
      });
      expect(courierDeactivate.status).toBe(200);
      expect(operatorDeactivate.status).toBe(200);

      const adminCouriers = await client.request({
        path: "/api/v1/admin/staff/couriers",
        method: "GET",
        origin: adminOrigin,
      });
      const adminOperators = await client.request({
        path: "/api/v1/admin/staff/operators",
        method: "GET",
        origin: adminOrigin,
      });
      expect((adminCouriers.body as { couriers: unknown[] }).couriers).not.toContainEqual(
        expect.objectContaining({ courierUserId }),
      );
      expect((adminOperators.body as { operators: unknown[] }).operators).toEqual([]);

      const adminArchive = await client.request({
        path: "/api/v1/admin/staff/operators?includeInactive=true",
        method: "GET",
        origin: adminOrigin,
      });
      expect(adminArchive.status).toBe(403);

      const adminReactivate = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/reactivate`,
        origin: adminOrigin,
        body: {},
      });
      expect(adminReactivate.status).toBe(403);

      runtime.prisma.state.account.role = "BOSS";
      const bossArchive = await client.request({
        path: "/api/v1/admin/staff/operators?includeInactive=true",
        method: "GET",
        origin: adminOrigin,
      });
      expect(bossArchive.status).toBe(200);
      expect(bossArchive.body).toEqual({
        operators: [
          expect.objectContaining({
            operatorAdminAccountId,
            activeStatus: "soft_deleted",
          }),
        ],
      });

      const bossCourierReactivate = await client.request({
        path: `/api/v1/admin/staff/couriers/${courierUserId}/reactivate`,
        origin: adminOrigin,
        body: {
          reason: "back",
        },
      });
      const bossOperatorReactivate = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/reactivate`,
        origin: adminOrigin,
        body: {
          reason: "back",
        },
      });
      expect(bossCourierReactivate.status).toBe(200);
      expect(bossOperatorReactivate.status).toBe(200);
    } finally {
      await runtime.stop();
    }
  });

  it("exposes card reads, rating adjustments, nickname update and boss password reset", async () => {
    const { runtime, client } = await loginStaffRuntime("BOSS");

    try {
      const courierResponse = await client.request({
        path: "/api/v1/admin/staff/couriers",
        origin: adminOrigin,
        body: {
          telegram_user_id: "99003",
          nickname: "Courier Card",
        },
      });
      const operatorResponse = await client.request({
        path: "/api/v1/admin/staff/operators",
        origin: adminOrigin,
        body: {
          email: "operator-card@example.com",
          nickname: "Operator Card",
          password: "strong-password-01",
        },
      });
      const courierUserId = String((courierResponse.body as { courier: { id: string } }).courier.id);
      const operatorAdminAccountId = String(
        (operatorResponse.body as { operator: { id: string } }).operator.id,
      );

      const courierRating = await client.request({
        path: `/api/v1/admin/staff/couriers/${courierUserId}/rating-adjustments`,
        origin: adminOrigin,
        body: {
          delta: 1,
          reason: "good recovery",
        },
      });
      const operatorRating = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/rating-adjustments`,
        origin: adminOrigin,
        body: {
          delta: -1,
          reason: "missed callback",
        },
      });
      const nicknameUpdate = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/nickname`,
        origin: adminOrigin,
        body: {
          nickname: "Senior Operator",
        },
      });
      const passwordReset = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}/password-reset`,
        origin: adminOrigin,
        body: {
          password: "new-password-01",
        },
      });

      expect(courierRating.status).toBe(201);
      expect(courierRating.body).toEqual({
        adjustment: expect.objectContaining({
          id: "1",
          courierUserId,
          delta: 1,
        }),
      });
      expect(operatorRating.status).toBe(201);
      expect(operatorRating.body).toEqual({
        adjustment: expect.objectContaining({
          id: "1",
          operatorAdminAccountId,
          delta: -1,
        }),
      });
      expect(nicknameUpdate.status).toBe(200);
      expect(passwordReset.status).toBe(200);
      expect(passwordReset.body).toEqual({
        operator: expect.objectContaining({
          id: operatorAdminAccountId,
          nickname: "Senior Operator",
        }),
        revokedSessionCount: 0,
        oneTimePassword: "new-password-01",
      });
      expect(runtime.prisma.state.operatorAccounts[0]?.passwordHash).not.toBe("new-password-01");

      const courierCard = await client.request({
        path: `/api/v1/admin/staff/couriers/${courierUserId}`,
        method: "GET",
        origin: adminOrigin,
      });
      const operatorCard = await client.request({
        path: `/api/v1/admin/staff/operators/${operatorAdminAccountId}`,
        method: "GET",
        origin: adminOrigin,
      });
      expect(courierCard.status).toBe(200);
      expect(courierCard.body).toEqual({
        courier: expect.objectContaining({
          courierUserId,
          manualRatingAdjustment: 1,
          manualRatingAdjustmentHistory: [
            expect.objectContaining({
              delta: 1,
              reason: "good recovery",
            }),
          ],
          lastOrders: expect.any(Array),
          problemOrders: expect.any(Array),
        }),
      });
      expect(operatorCard.status).toBe(200);
      expect(operatorCard.body).toEqual({
        operator: expect.objectContaining({
          operatorAdminAccountId,
          nickname: "Senior Operator",
          manualRatingAdjustment: -1,
          operatorRating: -1,
          manualRatingAdjustmentHistory: [
            expect.objectContaining({
              delta: -1,
              reason: "missed callback",
            }),
          ],
          lastProcessedOrders: expect.any(Array),
          problemOrders: expect.any(Array),
        }),
      });
    } finally {
      await runtime.stop();
    }
  });
});
