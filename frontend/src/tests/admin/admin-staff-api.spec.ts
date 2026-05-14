import { AdminStaffApiError, createAdminStaffApi } from "../../admin/api/admin-staff-api";

const couriersPayload = {
  couriers: [
    {
      courierUserId: "courier-user-1",
      nickname: "Courier One",
      telegramUserId: "99001",
      activeStatus: "active",
      deliveredOrdersCount: 120,
      manualRatingAdjustment: 1,
      automaticPenalties: -1,
      courierOrderRating: 1,
      courierAverageReviewRating: 4.5,
      courierClientReviewCount: 2,
      unsuccessfulOrdersCount: 3,
      unsuccessfulPercent: 2.5,
    },
  ],
};

const operatorsPayload = {
  operators: [
    {
      operatorAdminAccountId: "operator-account-1",
      nickname: "Operator One",
      email: "operator@example.com",
      activeStatus: "active",
      authActive: true,
      processedOrdersCount: 210,
      manualRatingAdjustment: -1,
      operatorRating: 1,
    },
  ],
};

const courierCardPayload = {
  courier: {
    ...couriersPayload.couriers[0],
    addedByAdminAccountId: "admin-1",
    addedAt: "2026-05-14T08:00:00.000Z",
    deactivatedByAdminAccountId: null,
    deactivatedAt: null,
    reactivatedByAdminAccountId: "boss-1",
    reactivatedAt: "2026-05-14T09:00:00.000Z",
    lifecycleHistory: [
      {
        actorAdminAccountId: "boss-1",
        action: "reactivated",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: "2026-05-14T09:00:00.000Z",
      },
    ],
    deactivationHistory: [],
    reactivationHistory: [
      {
        actorAdminAccountId: "boss-1",
        action: "reactivated",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: "2026-05-14T09:00:00.000Z",
      },
    ],
    manualRatingAdjustmentHistory: [
      {
        actorAdminAccountId: "admin-1",
        delta: 1,
        reason: "good shift",
        createdAt: "2026-05-14T10:00:00.000Z",
      },
    ],
    lastOrders: [
      {
        orderId: "order-11-unfinished",
        status: "IN_PROGRESS",
        createdAt: "2026-05-14T08:11:00.000Z",
        updatedAt: "2026-05-14T09:50:00.000Z",
        clientReviewRating: null,
        problemReasons: ["unfinished"],
      },
    ],
    problemOrders: [
      {
        orderId: "order-08-rating-one",
        status: "COMPLETED",
        createdAt: "2026-05-14T08:08:00.000Z",
        updatedAt: "2026-05-14T09:20:00.000Z",
        clientReviewRating: 1,
        problemReasons: ["client_rating_1"],
      },
    ],
    passwordHash: "must-not-be-parsed",
  },
};

const operatorCardPayload = {
  operator: {
    ...operatorsPayload.operators[0],
    addedByAdminAccountId: "admin-1",
    addedAt: "2026-05-14T08:00:00.000Z",
    deactivatedByAdminAccountId: null,
    deactivatedAt: null,
    reactivatedByAdminAccountId: "boss-1",
    reactivatedAt: "2026-05-14T09:00:00.000Z",
    lifecycleHistory: [
      {
        actorAdminAccountId: "boss-1",
        action: "reactivated",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: "2026-05-14T09:00:00.000Z",
      },
    ],
    deactivationHistory: [],
    reactivationHistory: [
      {
        actorAdminAccountId: "boss-1",
        action: "reactivated",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: "2026-05-14T09:00:00.000Z",
      },
    ],
    manualRatingAdjustmentHistory: [
      {
        actorAdminAccountId: "admin-1",
        delta: -1,
        reason: "missed close",
        createdAt: "2026-05-14T10:05:00.000Z",
      },
    ],
    lastProcessedOrders: [
      {
        orderId: "order-1",
        status: "COMPLETED",
        createdAt: "2026-05-14T07:00:00.000Z",
        updatedAt: "2026-05-14T08:00:00.000Z",
        lastWriteAt: "2026-05-14T08:00:00.000Z",
        actionTypes: ["status:COMPLETED"],
        personallyCompleted: true,
        problemReasons: [],
      },
    ],
    problemOrders: [
      {
        orderId: "order-2",
        status: "COMPLETED",
        createdAt: "2026-05-14T07:10:00.000Z",
        updatedAt: "2026-05-14T08:10:00.000Z",
        lastWriteAt: "2026-05-14T08:10:00.000Z",
        actionTypes: ["order.offer_created"],
        personallyCompleted: false,
        problemReasons: ["not_personally_completed"],
      },
    ],
    oneTimePassword: "must-not-be-parsed",
  },
};

describe("admin staff api", () => {
  it("loads courier and operator Staff panel tables from separate resources", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => couriersPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => operatorsPayload,
      });

    await expect(createAdminStaffApi({ fetch: fetchMock }).listStaffTables()).resolves.toEqual({
      couriers: couriersPayload.couriers,
      operators: operatorsPayload.operators,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/staff/couriers", {
      method: "GET",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/staff/operators", {
      method: "GET",
      credentials: "include",
    });
  });

  it("uses the boss archive query only when includeInactive is requested", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => couriersPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => operatorsPayload,
      });

    await createAdminStaffApi({ fetch: fetchMock }).listStaffTables({
      includeInactive: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/staff/couriers?includeInactive=true", {
      method: "GET",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/staff/operators?includeInactive=true", {
      method: "GET",
      credentials: "include",
    });
  });

  it("maps the Staff panel error contract into a controlled API error", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          code: "FORBIDDEN",
          message: "Staff panel requires admin or boss access",
          details: {
            role: "operator",
          },
        },
        trace_id: "trace-admin-staff-runtime",
      }),
    });

    await expect(createAdminStaffApi({ fetch: fetchMock }).listCouriers()).rejects.toEqual(
      new AdminStaffApiError("FORBIDDEN", "Staff panel requires admin or boss access", "trace-admin-staff-runtime", {
        role: "operator",
      }),
    );
  });

  it("loads courier and operator detail cards from verified Staff read endpoints", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => courierCardPayload,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => operatorCardPayload,
      });
    const api = createAdminStaffApi({ fetch: fetchMock });

    const courierCard = await api.getCourierCard({
      courierUserId: "courier/user 1",
      includeInactive: true,
    });
    const operatorCard = await api.getOperatorCard({
      operatorAdminAccountId: "operator/account 1",
    });

    expect(courierCard).toMatchObject({
      courierUserId: "courier-user-1",
      manualRatingAdjustmentHistory: [
        {
          delta: 1,
          reason: "good shift",
        },
      ],
      lastOrders: [
        {
          orderId: "order-11-unfinished",
          problemReasons: ["unfinished"],
        },
      ],
      problemOrders: [
        {
          orderId: "order-08-rating-one",
          clientReviewRating: 1,
        },
      ],
    });
    expect(operatorCard).toMatchObject({
      operatorAdminAccountId: "operator-account-1",
      manualRatingAdjustmentHistory: [
        {
          delta: -1,
          reason: "missed close",
        },
      ],
      lastProcessedOrders: [
        {
          orderId: "order-1",
          actionTypes: ["status:COMPLETED"],
          personallyCompleted: true,
        },
      ],
      problemOrders: [
        {
          orderId: "order-2",
          problemReasons: ["not_personally_completed"],
        },
      ],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/staff/couriers/courier%2Fuser%201?includeInactive=true", {
      method: "GET",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/staff/operators/operator%2Faccount%201", {
      method: "GET",
      credentials: "include",
    });
    expect(JSON.stringify(courierCard)).not.toContain("passwordHash");
    expect(JSON.stringify(operatorCard)).not.toContain("oneTimePassword");
  });

  it("posts courier create with only Telegram user id and nickname", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        courier: {
          id: "courier-user-new",
          telegramId: "99004",
          nickname: "Courier New",
          role: "courier",
        },
      }),
    });

    await expect(
      createAdminStaffApi({ fetch: fetchMock }).createCourier({
        telegramUserId: "99004",
        nickname: "Courier New",
      }),
    ).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/staff/couriers", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        telegram_user_id: "99004",
        nickname: "Courier New",
      }),
    });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("email");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("password");
  });

  it("posts operator create without an ADMIN/BOSS role chooser payload and returns the one-time password", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        operator: {
          id: "operator-account-new",
          login: "operator-new@example.com",
          nickname: "Operator New",
          role: "operator",
        },
        oneTimePassword: "strong-password-01",
      }),
    });

    await expect(
      createAdminStaffApi({ fetch: fetchMock }).createOperator({
        email: "operator-new@example.com",
        nickname: "Operator New",
        password: "strong-password-01",
      }),
    ).resolves.toEqual({
      oneTimePassword: "strong-password-01",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/staff/operators", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: "operator-new@example.com",
        nickname: "Operator New",
        password: "strong-password-01",
      }),
    });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("role");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("ADMIN");
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain("BOSS");
  });

  it("posts lifecycle, rating, reset and nickname commands to the verified Staff resources", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        operator: {
          id: "operator-account-1",
        },
        oneTimePassword: "new-password-01",
      }),
    });
    const api = createAdminStaffApi({ fetch: fetchMock });

    await api.deactivateCourier({ courierUserId: "courier/user 1", reason: null });
    await api.reactivateCourier({ courierUserId: "courier/user 1", reason: "back" });
    await api.adjustCourierRating({ courierUserId: "courier/user 1", delta: 1, reason: null });
    await api.deactivateOperator({ operatorAdminAccountId: "operator/account 1", reason: null });
    await api.reactivateOperator({ operatorAdminAccountId: "operator/account 1", reason: "back" });
    await api.adjustOperatorRating({ operatorAdminAccountId: "operator/account 1", delta: -1, reason: null });
    await expect(
      api.resetOperatorPassword({
        operatorAdminAccountId: "operator/account 1",
        password: "new-password-01",
      }),
    ).resolves.toEqual({
      oneTimePassword: "new-password-01",
    });
    await api.updateOperatorNickname({
      operatorAdminAccountId: "operator/account 1",
      nickname: "Operator Renamed",
    });

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "/api/v1/admin/staff/couriers/courier%2Fuser%201/deactivate",
      "/api/v1/admin/staff/couriers/courier%2Fuser%201/reactivate",
      "/api/v1/admin/staff/couriers/courier%2Fuser%201/rating-adjustments",
      "/api/v1/admin/staff/operators/operator%2Faccount%201/deactivate",
      "/api/v1/admin/staff/operators/operator%2Faccount%201/reactivate",
      "/api/v1/admin/staff/operators/operator%2Faccount%201/rating-adjustments",
      "/api/v1/admin/staff/operators/operator%2Faccount%201/password-reset",
      "/api/v1/admin/staff/operators/operator%2Faccount%201/nickname",
    ]);
    expect(fetchMock.mock.calls.map((call) => JSON.parse(String(call[1]?.body)))).toEqual([
      { reason: null },
      { reason: "back" },
      { delta: 1, reason: null },
      { reason: null },
      { reason: "back" },
      { delta: -1, reason: null },
      { password: "new-password-01" },
      { nickname: "Operator Renamed" },
    ]);
  });
});
