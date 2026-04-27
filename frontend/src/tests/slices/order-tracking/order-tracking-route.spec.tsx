import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LocalizationBoundary } from "../../../app/localization-boundary";
import { OrderTrackingRoute } from "../../../slices/order-tracking/routes/order-tracking-route";
import type { LanguageController } from "../../../shared/state/language";
import { createUiShellState } from "../../../shared/state/ui-shell";
import { UiShellProvider } from "../../../shared/state/ui-shell-context";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const collectText = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }

  if (node === null || typeof node !== "object") {
    return [];
  }

  const children = "children" in node ? (node.children as unknown[] | null) : null;

  if (children === null) {
    return [];
  }

  return children.flatMap((child) => collectText(child));
};

const createLanguageController = (): LanguageController => ({
  getState: () => ({
    language: "en",
    isHydrated: false,
    isOverlayVisible: true,
  }),
  hydrate: async () => ({
    language: "en",
    isHydrated: true,
    isOverlayVisible: false,
  }),
  selectLanguage: async () => ({
    language: "en",
    isHydrated: true,
    isOverlayVisible: false,
  }),
});

describe("order-tracking route", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message: unknown) => {
      if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
        return;
      }

      process.stderr.write(String(message));
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const renderRoute = async (api?: Parameters<typeof OrderTrackingRoute>[0]["api"]): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LocalizationBoundary controller={createLanguageController()}>
          <OrderTrackingRoute api={api} />
        </LocalizationBoundary>,
      );
      await flushPromises();
    });

    return renderer;
  };

  const renderRouteWithProps = async (props: Parameters<typeof OrderTrackingRoute>[0]): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LocalizationBoundary controller={createLanguageController()}>
          <OrderTrackingRoute {...props} />
        </LocalizationBoundary>,
      );
      await flushPromises();
    });

    return renderer;
  };

  const renderRouteWithShell = async (
    props: Parameters<typeof OrderTrackingRoute>[0],
    lifecycle: "active" | "inactive",
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LocalizationBoundary controller={createLanguageController()}>
          <UiShellProvider state={createUiShellState({ lifecycle })}>
            <OrderTrackingRoute {...props} />
          </UiShellProvider>
        </LocalizationBoundary>,
      );
      await flushPromises();
    });

    return renderer;
  };

  it("opens customer status from paid-order metadata without courier controls", async () => {
    const pollEvents = jest.fn().mockResolvedValue({
      events: [],
      nextCursor: "101",
    });
    const submitCourierAction = jest.fn();
    const renderer = await renderRouteWithProps({
      api: {
        loadTrackingSession: jest.fn(),
        pollEvents,
        submitCourierAction,
      },
      initialSession: {
        orderId: "order-1",
        currentStatus: "CREATED",
        initialCursor: "101",
        availableActions: [],
        isReadOnly: true,
      },
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Order tracking");
    expect(text).toContain("Order: order-1");
    expect(text).toContain("Current status: CREATED.");
    expect(text).toContain("Order paid and waiting for courier assignment");
    expect(text).toContain("Payment is confirmed.");
    expect(text).toContain("Cursor: 101");
    expect(text).not.toContain("Courier actions");
    expect(renderer.root.findAllByType("button")).toHaveLength(0);
    expect(submitCourierAction).not.toHaveBeenCalled();
  });

  it("renders customer-safe lifecycle copy without courier controls", async () => {
    const statuses = [
      ["CREATED", "Order paid and waiting for courier assignment", "Payment is confirmed."],
      ["ASSIGNED", "Courier assigned", "after the courier starts"],
      ["IN_PROGRESS", "Courier is on the way", "updates automatically through polling"],
      ["DELIVERED", "Order delivered", "waiting for final completion"],
      ["COMPLETED", "Order completed", "Thank you for your order"],
    ] as const;

    for (const [currentStatus, title, body] of statuses) {
      const renderer = await renderRouteWithProps({
        api: {
          loadTrackingSession: jest.fn(),
          pollEvents: jest.fn().mockResolvedValue({ events: [], nextCursor: "101" }),
          submitCourierAction: jest.fn(),
        },
        initialSession: {
          orderId: "order-1",
          currentStatus,
          initialCursor: "101",
          availableActions: [],
          isReadOnly: true,
        },
      });

      const text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain(title);
      expect(text).toContain(body);
      expect(text).not.toContain("Courier actions");
      expect(renderer.root.findAllByType("button")).toHaveLength(0);
    }
  });

  it("renders cancellation terminal states without audit or refund internals", async () => {
    const renderer = await renderRouteWithProps({
      api: {
        loadTrackingSession: jest.fn(),
        pollEvents: jest.fn().mockResolvedValue({ events: [], nextCursor: "201" }),
        submitCourierAction: jest.fn(),
      },
      initialSession: {
        orderId: "order-1",
        currentStatus: "CANCELLED_BY_ADMIN",
        initialCursor: "201",
        availableActions: [],
        isReadOnly: true,
      },
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: CANCELLED_BY_ADMIN.");
    expect(text).toContain("Order cancelled by operations");
    expect(text).toContain("Refund handling details stay outside the customer status screen.");
    expect(text).not.toContain("Courier actions");
    expect(text).not.toContain("audit");
    expect(text).not.toContain("refund_status");
    expect(text).not.toContain("PENDING_MANUAL");
    expect(renderer.root.findAllByType("button")).toHaveLength(0);
  });

  it("recovers safely when customer tracking opens without a paid order identity", async () => {
    const renderer = await renderRouteWithProps({ initialSession: null });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain(
      "We could not find the created order to track. Return to the catalog or complete checkout again.",
    );
    expect(text).toContain("Return to catalog");
    expect(text).not.toContain("Order: order-scaffold-1");
    expect(renderer.root.findAllByType("button")).toHaveLength(0);
  });

  it("applies ordered polling updates and ignores duplicate revisions after interval retries", async () => {
    const pollEvents = jest
      .fn()
      .mockResolvedValueOnce({
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
        ],
        nextCursor: "11",
      })
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        events: [
          {
            type: "order.status_changed",
            entity: "order",
            entityId: "order-1",
            payload: {
              orderId: "order-1",
              previousStatus: "DELIVERED",
              status: "COMPLETED",
              changedByUserId: "courier-1",
              updatedAt: "2026-04-03T12:10:00.000Z",
            },
            revision: "13",
            createdAt: "2026-04-03T12:10:00.000Z",
          },
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
      renderer.update(
        <LocalizationBoundary controller={createLanguageController()}>
          <UiShellProvider state={createUiShellState({ lifecycle: "inactive" })}>
            <OrderTrackingRoute {...props} />
          </UiShellProvider>
        </LocalizationBoundary>,
      );
      await flushPromises();
    });
    const callsAfterDeactivation = pollEvents.mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await flushPromises();
    });
    expect(pollEvents).toHaveBeenCalledTimes(callsAfterDeactivation);

    await act(async () => {
      renderer.update(
        <LocalizationBoundary controller={createLanguageController()}>
          <UiShellProvider state={createUiShellState({ lifecycle: "active" })}>
            <OrderTrackingRoute {...props} />
          </UiShellProvider>
        </LocalizationBoundary>,
      );
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
