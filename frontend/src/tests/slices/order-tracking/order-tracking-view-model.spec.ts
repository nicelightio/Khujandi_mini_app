import {
  applyOrderTrackingPollResult,
  createOrderTrackingConsumerState,
} from "../../../slices/order-tracking/model/order-tracking-view-model";

describe("order-tracking polling consumer", () => {
  it("advances the opaque cursor and ignores duplicate revisions", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "ASSIGNED",
      initialCursor: "10",
      availableActions: ["IN_PROGRESS"],
    });

    const nextState = applyOrderTrackingPollResult(initialState, {
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T12:00:00.000Z",
          },
          revision: "11",
          createdAt: "2026-04-03T12:00:00.000Z",
        },
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T12:00:00.000Z",
          },
          revision: "11",
          createdAt: "2026-04-03T12:00:00.000Z",
        },
      ],
      nextCursor: "11",
    });

    expect(nextState.cursor).toBe("11");
    expect(nextState.currentStatus).toBe("IN_PROGRESS");
    expect(nextState.appliedEventCount).toBe(1);
    expect(nextState.lastAppliedRevision).toBe("11");
  });
});
