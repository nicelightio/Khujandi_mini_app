import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LocalizationBoundary } from "../../../app/localization-boundary";
import { OrderTrackingRoute } from "../../../slices/order-tracking/routes/order-tracking-route";
import type { LanguageController } from "../../../shared/state/language";

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

  it("renders the polling scaffold and advances the cursor after the first poll", async () => {
    const renderer = await renderRoute({
      loadTrackingSession: async () => ({
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        initialCursor: "10",
        availableActions: ["IN_PROGRESS"],
      }),
      pollEvents: async () => ({
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
      }),
      submitCourierAction: jest.fn(),
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Order tracking");
    expect(text).toContain("Current status: IN_PROGRESS.");
    expect(text).toContain("Cursor: 11");
    expect(text).toContain("Updates applied: 1.");
    expect(text).toContain("Start delivery");
  });

  it("calls the courier action entrypoint and updates the displayed status", async () => {
    const submitCourierAction = jest.fn().mockResolvedValue({
      orderId: "order-1",
      status: "DELIVERED",
      revision: "12",
      updatedAt: "2026-04-03T12:05:00.000Z",
      availableActions: ["COMPLETED"],
    });
    const renderer = await renderRoute({
      loadTrackingSession: async () => ({
        orderId: "order-1",
        currentStatus: "IN_PROGRESS",
        initialCursor: "11",
        availableActions: ["DELIVERED"],
      }),
      pollEvents: async () => ({
        events: [],
        nextCursor: "11",
      }),
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
    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Current status: DELIVERED.");
    expect(text).toContain("Complete order");
  });
});
