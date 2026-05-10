import {
  createOrderTrackingApi,
  parseOrderTrackingPollResult,
  OrderTrackingApiError,
  type OrderTrackingEvent,
  type OrderTrackingStatus,
} from "../../../slices/order-tracking/api/order-tracking-api";
import {
  applyOrderTrackingActionResult,
  applyOrderTrackingPollResult,
  createOrderTrackingConsumerState,
} from "../../../slices/order-tracking/model/order-tracking-view-model";

const createStatusChangedEvent = (revision: string, status: OrderTrackingStatus): OrderTrackingEvent => ({
  type: "order.status_changed",
  entity: "order",
  entityId: "order-1",
  payload: {
    orderId: "order-1",
    previousStatus: "ASSIGNED",
    status,
    changedByUserId: "courier-1",
    updatedAt: "2026-04-03T12:00:00.000Z",
  },
  revision,
  createdAt: "2026-04-03T12:00:00.000Z",
});

describe("order-tracking polling consumer", () => {
  it("advances the opaque cursor and ignores duplicate revisions", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "ASSIGNED",
      initialCursor: "10",
      availableActions: ["PICKED_UP"],
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
            status: "PICKED_UP",
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
            status: "PICKED_UP",
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
    expect(nextState.currentStatus).toBe("PICKED_UP");
    expect(nextState.appliedEventCount).toBe(1);
    expect(nextState.lastAppliedRevision).toBe("11");
    expect(nextState.availableActions).toEqual(["IN_PROGRESS"]);
  });

  it("keeps empty polling windows stable while advancing the opaque next cursor", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "CREATED",
      initialCursor: "paid:order-1:rev-A",
      availableActions: [],
      isReadOnly: true,
    });

    const nextState = applyOrderTrackingPollResult(initialState, {
      events: [],
      nextCursor: "paid:order-1:rev-A",
    });

    expect(nextState).toEqual(initialState);
  });

  it("applies events in response order without numeric revision parsing", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "ASSIGNED",
      initialCursor: "cursor:9",
      availableActions: ["PICKED_UP"],
    });

    const nextState = applyOrderTrackingPollResult(initialState, {
      events: [
        createStatusChangedEvent("revision:10", "PICKED_UP"),
        createStatusChangedEvent("revision:2", "DELIVERED"),
      ],
      nextCursor: "cursor:after-revision-2",
    });

    expect(nextState.cursor).toBe("cursor:after-revision-2");
    expect(nextState.currentStatus).toBe("DELIVERED");
    expect(nextState.appliedEventCount).toBe(2);
    expect(nextState.lastAppliedRevision).toBe("revision:2");
    expect(nextState.seenRevisions).toEqual(["revision:10", "revision:2"]);
  });

  it("ignores out-of-order lifecycle regressions while preserving opaque cursor progress", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "IN_PROGRESS",
      initialCursor: "cursor:11",
      availableActions: [],
      isReadOnly: true,
    });

    const nextState = applyOrderTrackingPollResult(initialState, {
      events: [
        createStatusChangedEvent("revision:old-assigned", "ASSIGNED"),
        createStatusChangedEvent("revision:delivered", "DELIVERED"),
      ],
      nextCursor: "cursor:13",
    });

    expect(nextState.cursor).toBe("cursor:13");
    expect(nextState.currentStatus).toBe("DELIVERED");
    expect(nextState.appliedEventCount).toBe(1);
    expect(nextState.lastAppliedRevision).toBe("revision:delivered");
    expect(nextState.seenRevisions).toEqual(["revision:old-assigned", "revision:delivered"]);
    expect(nextState.availableActions).toEqual([]);
  });

  it("keeps terminal customer states closed when stale progress events arrive after resume", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "COMPLETED",
      initialCursor: "cursor:13",
      availableActions: [],
      isReadOnly: true,
    });

    const nextState = applyOrderTrackingPollResult(initialState, {
      events: [createStatusChangedEvent("revision:stale-delivered", "DELIVERED")],
      nextCursor: "cursor:14",
    });

    expect(nextState.cursor).toBe("cursor:14");
    expect(nextState.currentStatus).toBe("COMPLETED");
    expect(nextState.appliedEventCount).toBe(0);
    expect(nextState.lastAppliedRevision).toBeNull();
    expect(nextState.seenRevisions).toEqual(["revision:stale-delivered"]);
    expect(nextState.availableActions).toEqual([]);
  });

  it("marks command revisions as already applied so resumed polling does not double-apply them", () => {
    const initialState = createOrderTrackingConsumerState({
      orderId: "order-1",
      currentStatus: "PICKED_UP",
      initialCursor: "11",
      availableActions: ["IN_PROGRESS"],
    });

    const afterCommand = applyOrderTrackingActionResult(initialState, {
      orderId: "order-1",
      status: "IN_PROGRESS",
      revision: "12",
      availableActions: ["DELIVERED"],
    });
    const afterRetryPoll = applyOrderTrackingPollResult(afterCommand, {
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "PICKED_UP",
            status: "IN_PROGRESS",
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
    expect(afterRetryPoll.currentStatus).toBe("IN_PROGRESS");
    expect(afterRetryPoll.availableActions).toEqual(["DELIVERED"]);
  });
});

describe("order-tracking events API", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalizes snake-case event payloads and keeps cursors as opaque strings", () => {
    const result = parseOrderTrackingPollResult({
      events: [
        {
          type: "order.assigned",
          entity: "order",
          entity_id: "order-1",
          payload: {
            orderId: "order-1",
            courierId: "courier-1",
            assignedByUserId: "admin-1",
            status: "ASSIGNED",
            updatedAt: "2026-04-03T11:55:00.000Z",
          },
          revision: "rev:assigned:010",
          created_at: "2026-04-03T11:55:00.000Z",
        },
      ],
      next_cursor: "rev:assigned:010",
    });

    expect(result.nextCursor).toBe("rev:assigned:010");
    expect(result.events).toEqual([
      {
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: undefined,
          status: "ASSIGNED",
          changedByUserId: undefined,
          courierId: "courier-1",
          assignedByUserId: "admin-1",
          updatedAt: "2026-04-03T11:55:00.000Z",
        },
        revision: "rev:assigned:010",
        createdAt: "2026-04-03T11:55:00.000Z",
      },
    ]);
  });

  it("accepts FT-016 lifecycle statuses as parser compatibility without coercing cursors", () => {
    const result = parseOrderTrackingPollResult({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entity_id: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "CREATED",
            status: "DELAYED",
            changedByUserId: "operator-1",
            updatedAt: "2026-05-09T10:00:00.000Z",
          },
          revision: "rev:delayed",
          created_at: "2026-05-09T10:00:00.000Z",
        },
        {
          type: "order.status_changed",
          entity: "order",
          entity_id: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "PICKED_UP",
            changedByUserId: "courier-1",
            updatedAt: "2026-05-09T10:05:00.000Z",
          },
          revision: "rev:picked-up",
          created_at: "2026-05-09T10:05:00.000Z",
        },
      ],
      next_cursor: "rev:picked-up",
    });

    expect(result.nextCursor).toBe("rev:picked-up");
    expect(result.events.map((event) => event.payload.status)).toEqual(["DELAYED", "PICKED_UP"]);
    expect(result.events.map((event) => event.payload.previousStatus)).toEqual(["CREATED", "ASSIGNED"]);
  });

  it("normalizes operator status events from oldStatus/newStatus payload fields", () => {
    const result = parseOrderTrackingPollResult({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entity_id: "order-1",
          payload: {
            orderId: "order-1",
            oldStatus: "DELIVERED",
            newStatus: "COMPLETED",
            changedByUserId: "operator-1",
            changedByRole: "operator",
            changedByName: "Operator One",
            updatedAt: "2026-05-09T12:10:00.000Z",
          },
          revision: "rev:operator:completed",
          created_at: "2026-05-09T12:10:00.000Z",
        },
      ],
      next_cursor: "rev:operator:completed",
    });

    expect(result.nextCursor).toBe("rev:operator:completed");
    expect(result.events[0]).toMatchObject({
      type: "order.status_changed",
      entityId: "order-1",
      payload: {
        previousStatus: "DELIVERED",
        status: "COMPLETED",
        changedByUserId: "operator-1",
      },
      revision: "rev:operator:completed",
    });
  });

  it("normalizes timeout delayed events from newStatus and oldStatus payload fields", () => {
    const result = parseOrderTrackingPollResult({
      events: [
        {
          type: "order.delayed",
          entity: "order",
          entity_id: "order-timeout-1",
          payload: {
            orderId: "order-timeout-1",
            oldStatus: "CREATED",
            newStatus: "DELAYED",
            reason: "assignment_timeout",
            updatedAt: "2026-05-09T12:06:10.000Z",
          },
          revision: "rev:delayed:timeout",
          created_at: "2026-05-09T12:06:10.000Z",
        },
      ],
      next_cursor: "rev:delayed:timeout",
    });

    expect(result).toEqual({
      events: [
        {
          type: "order.delayed",
          entity: "order",
          entityId: "order-timeout-1",
          payload: {
            orderId: "order-timeout-1",
            previousStatus: "CREATED",
            status: "DELAYED",
            changedByUserId: undefined,
            courierId: undefined,
            assignedByUserId: undefined,
            updatedAt: "2026-05-09T12:06:10.000Z",
          },
          revision: "rev:delayed:timeout",
          createdAt: "2026-05-09T12:06:10.000Z",
        },
      ],
      nextCursor: "rev:delayed:timeout",
    });
  });

  it("rejects non-string next cursors instead of coercing them", () => {
    expect(() =>
      parseOrderTrackingPollResult({
        events: [],
        next_cursor: 101,
      }),
    ).toThrow(OrderTrackingApiError);
  });

  it("requests GET /events with an encoded opaque since cursor", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          events: [],
          next_cursor: "cursor/with spaces?rev=101",
        }),
        { status: 200 },
      ),
    );

    const result = await createOrderTrackingApi().pollEvents("cursor/with spaces?rev=101");

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/events?since=cursor%2Fwith+spaces%3Frev%3D101", {
      credentials: "same-origin",
    });
    expect(result.nextCursor).toBe("cursor/with spaces?rev=101");
    expect(result.events).toEqual([]);
  });
});
