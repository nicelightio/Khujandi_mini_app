import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LocalizationBoundary } from "../../../app/localization-boundary";
import { OrderTrackingRoute } from "../../../slices/order-tracking/routes/order-tracking-route";
import type { LanguageController } from "../../../shared/state/language";
import { createUiShellState } from "../../../shared/state/ui-shell";
import { UiShellProvider } from "../../../shared/state/ui-shell-context";

type OrderTrackingRouteProps = Parameters<typeof OrderTrackingRoute>[0];

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

export const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

export const collectText = (node: unknown): string[] => {
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

export const createLanguageController = (): LanguageController => ({
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

export const TrackingRouteWithShell = ({
  props,
  lifecycle,
}: {
  props: OrderTrackingRouteProps;
  lifecycle: "active" | "inactive";
}) => (
  <LocalizationBoundary controller={createLanguageController()}>
    <UiShellProvider state={createUiShellState({ lifecycle })}>
      <OrderTrackingRoute {...props} />
    </UiShellProvider>
  </LocalizationBoundary>
);

export const renderRoute = async (api?: OrderTrackingRouteProps["api"]): Promise<ReactTestRenderer> => {
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

export const renderRouteWithProps = async (props: OrderTrackingRouteProps): Promise<ReactTestRenderer> => {
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

export const renderRouteWithShell = async (
  props: OrderTrackingRouteProps,
  lifecycle: "active" | "inactive",
): Promise<ReactTestRenderer> => {
  let renderer!: ReactTestRenderer;

  await act(async () => {
    renderer = create(<TrackingRouteWithShell props={props} lifecycle={lifecycle} />);
    await flushPromises();
  });

  return renderer;
};

export const orderStatusChangedEvent = ({
  orderId = "order-1",
  previousStatus,
  status,
  revision,
  updatedAt,
}: {
  orderId?: string;
  previousStatus: string;
  status: string;
  revision: string;
  updatedAt: string;
}) => ({
  type: "order.status_changed",
  entity: "order",
  entityId: orderId,
  payload: {
    orderId,
    previousStatus,
    status,
    changedByUserId: "courier-1",
    updatedAt,
  },
  revision,
  createdAt: updatedAt,
});

export const silenceReactTestRendererDeprecation = () =>
  jest.spyOn(console, "error").mockImplementation((message: unknown) => {
    if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
      return;
    }

    process.stderr.write(String(message));
  });
