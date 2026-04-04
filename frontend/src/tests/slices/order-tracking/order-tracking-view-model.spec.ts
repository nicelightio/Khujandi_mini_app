import {
  applyOrderTrackingActionResult,
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
    expect(nextState.availableActions).toEqual(["DELIVERED"]);
  });

  it("marks command revisions as already applied so resumed polling does not double-apply them", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "IN_PROGRESS",
      initialCursor: "11",
      availableActions: ["DELIVERED"],
    });

    const afterCommand = applyOrderTrackingActionResult(initialState, {
      orderId: "order-1",
      status: "DELIVERED",
      revision: "12",
      availableActions: ["COMPLETED"],
    });
    const afterRetryPoll = applyOrderTrackingPollResult(afterCommand, {
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T12:05:00.000Z",
          },
          revision: "12",
          createdAt: "2026-04-03T12:05:00.000Z",
        },
      ],
      nextCursor: "12",
    });

    expect(afterCommand.cursor).toBe("12");
    expect(afterCommand.appliedEventCount).toBe(1);
    expect(afterRetryPoll.appliedEventCount).toBe(1);
    expect(afterRetryPoll.currentStatus).toBe("DELIVERED");
    expect(afterRetryPoll.availableActions).toEqual(["COMPLETED"]);
  });
});
