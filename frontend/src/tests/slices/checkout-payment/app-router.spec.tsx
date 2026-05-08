import { AppRouter, appRoutes, resolveAppRoute } from "../../../app/router";
import { CatalogRoute } from "../../../slices/catalog/routes/catalog-route";
import { CheckoutPaymentRoute } from "../../../slices/checkout-payment/routes/checkout-payment-route";
import { OrderTrackingRoute } from "../../../slices/order-tracking/routes/order-tracking-route";
import type { LanguageController } from "../../../shared/state/language";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

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

const hydratedLanguageController: LanguageController = {
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

describe("app router", () => {
  it("resolves the catalog route for the root pathname", () => {
    expect(resolveAppRoute("/").element.type).toBe(CatalogRoute);
  });

  it("resolves the checkout route for the checkout pathname", () => {
    expect(resolveAppRoute("/checkout").element.type).toBe(CheckoutPaymentRoute);
  });

  it("falls back to catalog when pathname is unknown", () => {
    expect(resolveAppRoute("/missing").element.type).toBe(CatalogRoute);
  });

  it("resolves the order-tracking route for the tracking pathname", () => {
    expect(resolveAppRoute("/tracking").element.type).toBe(OrderTrackingRoute);
  });

  it("matches the storefront route only for a single /shops/:shopId segment", () => {
    const storefrontRoute = appRoutes.find((route) => route.path === "/shops/:publicPath");

    expect(storefrontRoute?.matches?.("/shops/shop-1")).toBe(true);
    expect(storefrontRoute?.matches?.("/shops/shop-1/menu-page-1")).toBe(false);
    expect(storefrontRoute?.matches?.("/shops")).toBe(false);
  });

  it("uses the browser pathname at runtime", async () => {
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          pathname: "/checkout",
        },
      },
      configurable: true,
      writable: true,
    });

    try {
      let renderer!: ReactTestRenderer;

      await act(async () => {
        renderer = create(<AppRouter languageController={hydratedLanguageController} />);
        await flushPromises();
      });

      expect(collectText(renderer.toJSON()).join(" ")).toContain("Checkout");
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });
});
