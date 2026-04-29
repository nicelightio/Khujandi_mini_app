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
});
