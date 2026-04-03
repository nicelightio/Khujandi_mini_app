import {
  AdminAssignmentApiError,
  createAdminAssignmentApi,
} from "../../admin/api/admin-assignment-api";

describe("admin assignment api", () => {
  it("posts courier assignment to the backend command path", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        orderId: "order-created-77",
        courierId: "courier-2",
        status: "ASSIGNED",
        updatedAt: "2026-04-03T10:00:00.000Z",
        revision: "91",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).submitAssignment({
        orderId: "order-created-77",
        courierId: "courier-2",
      }),
    ).resolves.toEqual({
      orderId: "order-created-77",
      courierId: "courier-2",
      status: "ASSIGNED",
      updatedAt: "2026-04-03T10:00:00.000Z",
      revision: "91",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/orders/order-created-77/assignment", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        courierId: "courier-2",
      }),
    });
  });

  it("renders the project error contract as a controlled API error", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "CONFLICT",
          message: "Order cannot be assigned from the current state",
          details: {
            currentStatus: "ASSIGNED",
          },
        },
        trace_id: "trace-ft004-06",
      }),
    });

    await expect(
      createAdminAssignmentApi({ fetch: fetchMock }).submitAssignment({
        orderId: "order-created-77",
        courierId: "courier-2",
      }),
    ).rejects.toEqual(
      new AdminAssignmentApiError(
        "CONFLICT",
        "Order cannot be assigned from the current state",
        "trace-ft004-06",
        { currentStatus: "ASSIGNED" },
      ),
    );
  });
});
