import { act } from "react-test-renderer";
import {
  collectText,
  flushPromises,
  orderStatusChangedEvent,
  renderRoute,
  renderRouteWithShell,
  silenceReactTestRendererDeprecation,
  TrackingRouteWithShell,
} from "./order-tracking-route.test-utils";

describe("order-tracking route polling", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = silenceReactTestRendererDeprecation();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it("applies ordered polling updates and ignores duplicate revisions after interval retries", async () => {
    const pollEvents = jest
      .fn()
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            revision: "11",
            updatedAt: "2026-04-03T12:00:00.000Z",
          }),
        ],
        nextCursor: "11",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            revision: "11",
            updatedAt: "2026-04-03T12:00:00.000Z",
          }),
        ],
        nextCursor: "11",
      });
    const renderer = await renderRoute({
      loadTrackingSession: async () => ({
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        initialCursor: "10",
        availableActions: ["IN_PROGRESS"],
      }),
      pollEvents,
      submitCourierAction: jest.fn(),
    });

    let text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Order tracking");
    expect(text).toContain("Current status: IN_PROGRESS.");
    expect(text).toContain("Cursor: 11");
    expect(text).toContain("Updates applied: 1.");
    expect(text).toContain("Mark as delivered");

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });

    text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Updates applied: 1.");
    expect(pollEvents).toHaveBeenNthCalledWith(1, "10");
    expect(pollEvents).toHaveBeenNthCalledWith(2, "11");
  });

  it("keeps command-applied revisions duplicate-safe when polling resumes after submit", async () => {
    const submitCourierAction = jest.fn().mockResolvedValue({
      orderId: "order-1",
      status: "DELIVERED",
      revision: "12",
      updatedAt: "2026-04-03T12:05:00.000Z",
      availableActions: ["COMPLETED"],
    });
    const pollEvents = jest
      .fn()
      .mockResolvedValueOnce({
        events: [],
        nextCursor: "11",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            revision: "12",
            updatedAt: "2026-04-03T12:05:00.000Z",
          }),
        ],
        nextCursor: "12",
      });
    const renderer = await renderRoute({
      loadTrackingSession: async () => ({
        orderId: "order-1",
        currentStatus: "IN_PROGRESS",
        initialCursor: "11",
        availableActions: ["DELIVERED"],
      }),
      pollEvents,
      submitCourierAction,
    });

    await act(async () => {
      renderer.root.findByType("button").props.onClick();
      await flushPromises();
    });

    expect(submitCourierAction).toHaveBeenCalledWith({
      orderId: "order-1",
      nextStatus: "DELIVERED",
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: DELIVERED.");
    expect(text).toContain("Complete order");
    expect(text).toContain("Updates applied: 1.");
    expect(pollEvents).toHaveBeenNthCalledWith(2, "12");
  });

  it("drives the courier flow to COMPLETED while ordered polling stays duplicate-safe across resume", async () => {
    const submitCourierAction = jest
      .fn()
      .mockResolvedValueOnce({
        orderId: "order-1",
        status: "IN_PROGRESS",
        revision: "11",
        updatedAt: "2026-04-03T12:00:00.000Z",
        availableActions: ["DELIVERED"],
      })
      .mockResolvedValueOnce({
        orderId: "order-1",
        status: "DELIVERED",
        revision: "12",
        updatedAt: "2026-04-03T12:05:00.000Z",
        availableActions: ["COMPLETED"],
      })
      .mockResolvedValueOnce({
        orderId: "order-1",
        status: "COMPLETED",
        revision: "13",
        updatedAt: "2026-04-03T12:10:00.000Z",
        availableActions: [],
      });
    const pollEvents = jest
      .fn()
      .mockResolvedValueOnce({
        events: [],
        nextCursor: "10",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            revision: "11",
            updatedAt: "2026-04-03T12:00:00.000Z",
          }),
        ],
        nextCursor: "11",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            revision: "12",
            updatedAt: "2026-04-03T12:05:00.000Z",
          }),
        ],
        nextCursor: "12",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "DELIVERED",
            status: "COMPLETED",
            revision: "13",
            updatedAt: "2026-04-03T12:10:00.000Z",
          }),
        ],
        nextCursor: "13",
      })
      .mockResolvedValueOnce({
        events: [],
        nextCursor: "13",
      });
    const renderer = await renderRoute({
      loadTrackingSession: async () => ({
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        initialCursor: "10",
        availableActions: ["IN_PROGRESS"],
      }),
      pollEvents,
      submitCourierAction,
    });

    await act(async () => {
      renderer.root.findAllByType("button")[0].props.onClick();
      await flushPromises();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("button")[0].props.onClick();
      await flushPromises();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findAllByType("button")[0].props.onClick();
      await flushPromises();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: COMPLETED.");
    expect(text).toContain("Updates applied: 3.");
    expect(text).toContain("Cursor: 13");
    expect(text).toContain("Latest revision: 13.");
    expect(text).not.toContain("Start delivery");
    expect(text).not.toContain("Mark as delivered");
    expect(text).not.toContain("Complete order");
    expect(submitCourierAction).toHaveBeenNthCalledWith(1, {
      orderId: "order-1",
      nextStatus: "IN_PROGRESS",
    });
    expect(submitCourierAction).toHaveBeenNthCalledWith(2, {
      orderId: "order-1",
      nextStatus: "DELIVERED",
    });
    expect(submitCourierAction).toHaveBeenNthCalledWith(3, {
      orderId: "order-1",
      nextStatus: "COMPLETED",
    });
    expect(pollEvents).toHaveBeenNthCalledWith(1, "10");
    expect(pollEvents).toHaveBeenNthCalledWith(2, "11");
    expect(pollEvents).toHaveBeenNthCalledWith(3, "12");
    expect(pollEvents).toHaveBeenNthCalledWith(4, "13");
  });

  it("pauses on shell deactivation and resumes polling duplicate-safely from the latest cursor", async () => {
    const pollEvents = jest
      .fn()
      .mockResolvedValueOnce({
        events: [],
        nextCursor: "10",
      })
      .mockResolvedValueOnce({
        events: [
          orderStatusChangedEvent({
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            revision: "11",
            updatedAt: "2026-04-03T12:00:00.000Z",
          }),
        ],
        nextCursor: "11",
      });
    const props = {
      api: {
        loadTrackingSession: async () => ({
          orderId: "order-1",
          currentStatus: "ASSIGNED" as const,
          initialCursor: "10",
          availableActions: [],
          isReadOnly: true,
        }),
        pollEvents,
        submitCourierAction: jest.fn(),
      },
    };
    const renderer = await renderRouteWithShell(props, "active");

    await act(async () => {
      renderer.update(<TrackingRouteWithShell props={props} lifecycle="inactive" />);
      await flushPromises();
    });
    const callsAfterDeactivation = pollEvents.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });
    expect(pollEvents).toHaveBeenCalledTimes(callsAfterDeactivation);

    await act(async () => {
      renderer.update(<TrackingRouteWithShell props={props} lifecycle="active" />);
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: IN_PROGRESS.");
    expect(text).toContain("Updates applied: 1.");
    expect(pollEvents).toHaveBeenNthCalledWith(1, "10");
    expect(pollEvents).toHaveBeenLastCalledWith("10");
    expect(props.api.submitCourierAction).not.toHaveBeenCalled();
  });
});
