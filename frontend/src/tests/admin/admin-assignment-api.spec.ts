import {
  AdminAssignmentApiError,
  createAdminAssignmentApi,
} from "../../admin/api/admin-assignment-api";

const operatorOrdersPayload = {
  window: {
    from: "2026-05-05T19:00:00.000Z",
    to: "2026-05-09T12:00:00.000Z",
  },
  generatedAt: "2026-05-09T12:00:00.000Z",
  revision: "42",
  orders: [
    {
      orderId: "order-created-77",
      publicOrderNumber: "order-created-77",
      summary: {
        shopName: "Khujandi Plov",
        totalAmountMinor: 12500,
        currency: "TJS",
      },
      createdAt: "2026-05-09T11:40:00.000Z",
      updatedAt: "2026-05-09T11:45:00.000Z",
      status: "DELAYED",
      severity: "delayed",
      courier: {
        marker: "absent",
        current: null,
      },
      assignedAt: null,
      claimedAt: null,
      latestMessage: null,
      latestMessagePreview: null,
      latestMessageSenderRole: null,
      statusRevision: "42",
      history: [
        {
          id: "history-1",
          status: "DELAYED",
          previousStatus: "CREATED",
          changedAt: "2026-05-09T11:45:00.000Z",
          actor: {
            userId: "admin-account-1",
            role: "admin",
            name: "Admin One",
          },
          timeInStatusSeconds: null,
          timeSinceOrderCreatedSeconds: 300,
          comments: {
            courier: null,
            admin: null,
            customer: null,
            shopOwner: null,
          },
        },
      ],
    },
  ],
};

describe("admin assignment api", () => {
  it("loads the operator delivery orders read model from the admin endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => operatorOrdersPayload,
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).listOperatorDeliveryOrders(),
    ).resolves.toEqual(operatorOrdersPayload);

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/operator/delivery/orders", {
      method: "GET",
      credentials: "include",
    });
  });

  it("keeps null latest-message placeholders and absent courier markers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => operatorOrdersPayload,
    });

    const result = await createAdminAssignmentApi({ fetch: fetchMock }).listOperatorDeliveryOrders();

    expect(result.orders[0]).toMatchObject({
      severity: "delayed",
      courier: {
        marker: "absent",
        current: null,
      },
      latestMessage: null,
      latestMessagePreview: null,
      latestMessageSenderRole: null,
    });
  });

  it("renders the project error contract as a controlled API error", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: "AUTH_REQUIRED",
          message: "Admin session required",
          details: {
            route: "operator-delivery-orders",
          },
        },
        trace_id: "trace-ft016-04",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).listOperatorDeliveryOrders(),
    ).rejects.toEqual(
      new AdminAssignmentApiError(
        "AUTH_REQUIRED",
        "Admin session required",
        "trace-ft016-04",
        { route: "operator-delivery-orders" },
      ),
    );
  });

  it("creates a manual targeted offer through the pending offer endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        orderId: "order-created-77",
        offerId: "offer-77",
        targetCourierId: "courier-7",
        kind: "manual",
        status: "pending",
        orderStatus: "CREATED",
        updatedAt: "2026-05-09T12:00:00.000Z",
        revision: "43",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).createManualTargetedOffer({
        orderId: "order-created-77",
        courierId: "courier-7",
      }),
    ).resolves.toEqual({
      orderId: "order-created-77",
      offerId: "offer-77",
      targetCourierId: "courier-7",
      kind: "manual",
      status: "pending",
      orderStatus: "CREATED",
      updatedAt: "2026-05-09T12:00:00.000Z",
      revision: "43",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/orders/order-created-77/assignment-offers", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courierId: "courier-7",
      }),
    });
  });

  it("creates an explicit broadcast offer through the default-off auto-offer endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        orderId: "order-created-77",
        kind: "broadcast",
        status: "pending",
        orderStatus: "CREATED",
        eligibleCourierCount: 2,
        offers: [
          {
            orderId: "order-created-77",
            offerId: "offer-broadcast-1",
            targetCourierId: "courier-7",
            kind: "broadcast",
            status: "pending",
            orderStatus: "CREATED",
            updatedAt: "2026-05-09T12:00:00.000Z",
            revision: "44",
          },
          {
            orderId: "order-created-77",
            offerId: "offer-broadcast-2",
            targetCourierId: "courier-8",
            kind: "broadcast",
            status: "pending",
            orderStatus: "CREATED",
            updatedAt: "2026-05-09T12:00:00.000Z",
            revision: "45",
          },
        ],
        updatedAt: "2026-05-09T12:00:00.000Z",
        revision: "45",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).createBroadcastOffer({
        orderId: "order-created-77",
      }),
    ).resolves.toMatchObject({
      orderId: "order-created-77",
      kind: "broadcast",
      status: "pending",
      eligibleCourierCount: 2,
      offers: [
        expect.objectContaining({
          offerId: "offer-broadcast-1",
          targetCourierId: "courier-7",
          kind: "broadcast",
        }),
        expect.objectContaining({
          offerId: "offer-broadcast-2",
          targetCourierId: "courier-8",
          kind: "broadcast",
        }),
      ],
      revision: "45",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/orders/order-created-77/auto-offers", {
      method: "POST",
      credentials: "include",
    });
  });

  it("updates an operator-controlled order status through the confirmed status endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orderId: "order-delivered-77",
        status: "COMPLETED",
        updatedAt: "2026-05-09T12:05:00.000Z",
        revision: "46",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).updateOperatorOrderStatus({
        orderId: "order-delivered-77",
        nextStatus: "COMPLETED",
      }),
    ).resolves.toEqual({
      orderId: "order-delivered-77",
      status: "COMPLETED",
      updatedAt: "2026-05-09T12:05:00.000Z",
      revision: "46",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/operator/delivery/orders/order-delivered-77/status", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nextStatus: "COMPLETED",
      }),
    });
  });
});
