import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LocalizationBoundary } from "../../../app/localization-boundary";
import { OrderTrackingRoute } from "../../../slices/order-tracking/routes/order-tracking-route";
import type { LanguageController } from "../../../shared/state/language";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const pollingOffsetSamplesMs = Array.from({ length: 20 }, (_, index) => (index + 1) * 250);

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

const percentile95 = (values: number[]): number => {
  const sortedValues = [...values].sort((left, right) => left - right);
  const index = Math.ceil(sortedValues.length * 0.95) - 1;

  return sortedValues[Math.max(index, 0)] ?? 0;
};

describe("order-tracking polling SLA", () => {
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

  it("keeps polling visibility p95 within 10 seconds for the repo-local MVP profile", async () => {
    const observedLatenciesMs: number[] = [];

    for (const eventOffsetMs of pollingOffsetSamplesMs) {
      const sampleStartedAtMs = Date.now();
      let eventDelivered = false;
      const pollEvents = jest.fn().mockImplementation(async () => {
        const elapsedMs = Date.now() - sampleStartedAtMs;

        if (!eventDelivered && elapsedMs >= eventOffsetMs) {
          eventDelivered = true;

          return {
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
                  updatedAt: new Date(sampleStartedAtMs + eventOffsetMs).toISOString(),
                },
                revision: "11",
                createdAt: new Date(sampleStartedAtMs + eventOffsetMs).toISOString(),
              },
            ],
            nextCursor: "11",
          };
        }

        return {
          events: [],
          nextCursor: "10",
        };
      });

      const renderer = await renderRoute({
        loadTrackingSession: async () => ({
          orderId: "order-1",
          currentStatus: "ASSIGNED",
          initialCursor: "10",
          availableActions: ["PICKED_UP"],
        }),
        pollEvents,
        submitCourierAction: jest.fn(),
      });

      await act(async () => {
        jest.advanceTimersByTime(5000);
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Current status: PICKED_UP.");
      expect(text).toContain("Cursor: 11");
      expect(text).toContain("Updates applied: 1.");

      const detectedAtMs = Date.now() - sampleStartedAtMs;
      observedLatenciesMs.push(detectedAtMs - eventOffsetMs);

      await act(async () => {
        renderer.unmount();
        await flushPromises();
      });
    }

    const p95LatencyMs = percentile95(observedLatenciesMs);

    expect(p95LatencyMs).toBe(4500);
    expect(p95LatencyMs).toBeLessThanOrEqual(10000);
    expect(Math.max(...observedLatenciesMs)).toBeLessThanOrEqual(4750);
  });
});
