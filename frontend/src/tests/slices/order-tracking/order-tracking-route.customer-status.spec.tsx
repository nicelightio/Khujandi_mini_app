import { createOrderTrackingApi } from "../../../slices/order-tracking/api/order-tracking-api";
import { collectText, renderRouteWithProps, silenceReactTestRendererDeprecation } from "./order-tracking-route.test-utils";

describe("order-tracking route customer status", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = silenceReactTestRendererDeprecation();
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

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
      ["DELAYED", "Order needs urgent attention", "Courier assignment is taking longer"],
      ["ASSIGNED", "Courier assigned", "after the courier starts"],
      ["PICKED_UP", "Courier picked up the order", "picked up the order from the shop"],
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

  it("renders DELAYED as waiting/problem copy without courier progress controls", async () => {
    const renderer = await renderRouteWithProps({
      api: {
        loadTrackingSession: jest.fn(),
        pollEvents: jest.fn().mockResolvedValue({ events: [], nextCursor: "delayed:101" }),
        submitCourierAction: jest.fn(),
      },
      initialSession: {
        orderId: "order-delayed-1",
        currentStatus: "DELAYED",
        initialCursor: "delayed:100",
        availableActions: [],
        isReadOnly: true,
      },
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: DELAYED.");
    expect(text).toContain("Order needs urgent attention");
    expect(text).toContain("Courier assignment is taking longer than expected.");
    expect(text).not.toContain("Courier is on the way");
    expect(text).not.toContain("Start delivery");
    expect(text).not.toContain("Courier actions");
    expect(renderer.root.findAllByType("button")).toHaveLength(0);
  });

  it("keeps an open customer tracking screen in sync with timeout delayed polling events", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          events: [
            {
              type: "order.delayed",
              entity: "order",
              entity_id: "order-delayed-1",
              payload: {
                orderId: "order-delayed-1",
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
        }),
        { status: 200 },
      ),
    );

    const renderer = await renderRouteWithProps({
      api: createOrderTrackingApi(),
      initialSession: {
        orderId: "order-delayed-1",
        currentStatus: "CREATED",
        initialCursor: "rev:created",
        availableActions: [],
        isReadOnly: true,
      },
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: DELAYED.");
    expect(text).toContain("Order needs urgent attention");
    expect(text).toContain("Courier assignment is taking longer than expected.");
    expect(text).toContain("Cursor: rev:delayed:timeout");
    expect(text).not.toContain("Courier is on the way");
    expect(text).not.toContain("Courier actions");
    expect(renderer.root.findAllByType("button")).toHaveLength(0);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/v1/events?since=rev%3Acreated", {
      credentials: "same-origin",
    });
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
});
