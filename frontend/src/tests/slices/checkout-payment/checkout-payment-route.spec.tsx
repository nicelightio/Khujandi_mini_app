import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LocalizationBoundary } from "../../../app/localization-boundary";
import { CheckoutPaymentApiError } from "../../../slices/checkout-payment/api/checkout-payment-api";
import type { CheckoutCompositionHandoff } from "../../../slices/checkout-payment/model/composition-handoff";
import { CheckoutPaymentRoute } from "../../../slices/checkout-payment/routes/checkout-payment-route";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import type { LanguageController } from "../../../shared/state/language";
import type { TelegramWebAppBridge } from "../../../shared/telegram/webapp";

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

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy: jest.SpyInstance;

const composition = {
  shop_public_path: "khujand-bakery",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 2,
      display_snapshot: {
        product_name: "Somsa",
        unit_price_minor: 1500,
        currency: "TJS" as const,
      },
    },
  ],
  preview_total: {
    amount_minor: 3000,
    currency: "TJS" as const,
  },
  created_at: "2026-04-25T00:00:00.000Z",
};

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

describe("checkout-payment route", () => {
  const createLanguageController = (language: SupportedLanguage = "en"): LanguageController => ({
    getState: () => ({
      language: "ru",
      isHydrated: false,
      isOverlayVisible: true,
    }),
    hydrate: async () => ({
      language,
      isHydrated: true,
      isOverlayVisible: false,
    }),
    selectLanguage: async (selectedLanguage) => ({
      language: selectedLanguage,
      isHydrated: true,
      isOverlayVisible: false,
    }),
  });

  const createBridge = (initData: string | null): TelegramWebAppBridge => ({
    ready: jest.fn(),
    expand: jest.fn(),
    getInitData: jest.fn().mockReturnValue(initData),
    isAvailable: jest.fn().mockReturnValue(initData !== null),
    isVersionAtLeast: jest.fn().mockReturnValue(false),
    getColorScheme: jest.fn().mockReturnValue("unknown"),
    getViewport: jest.fn().mockReturnValue({
      height: null,
      stableHeight: null,
      isExpanded: false,
    }),
    getSafeAreaInsets: jest.fn().mockReturnValue({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
    getContentSafeAreaInsets: jest.fn().mockReturnValue({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }),
    getRuntimeSnapshot: jest.fn().mockReturnValue({
      isAvailable: initData !== null,
      colorScheme: "unknown",
      viewport: {
        height: null,
        stableHeight: null,
        isExpanded: false,
      },
      safeAreaInsets: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      contentSafeAreaInsets: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    }),
    onEvent: jest.fn().mockReturnValue(() => undefined),
    setBackButtonVisible: jest.fn(),
    setSwipeBehavior: jest.fn(),
    deviceStorage: {
      getLanguage: async () => null,
      setLanguage: async () => undefined,
    },
    cloudStorage: {
      getLanguage: async () => null,
      setLanguage: async () => undefined,
    },
  });

  const renderRoute = async (
    props?: Parameters<typeof CheckoutPaymentRoute>[0],
    languageController: LanguageController = createLanguageController(),
    handoff: CheckoutCompositionHandoff | null = composition,
  ): Promise<ReactTestRenderer> => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LocalizationBoundary controller={languageController}>
          <CheckoutPaymentRoute {...props} compositionHandoff={handoff} />
        </LocalizationBoundary>,
      );
      await flushPromises();
    });

    return renderer;
  };

  it("shows a loading shell and then the ready checkout scaffold", async () => {
    const bridge = createBridge("query_id=raw");
    const renderer = await renderRoute({ bridge });

    const text = collectText(renderer.toJSON()).join(" ");
    const actionZone = renderer.root.findByProps({ "data-shell-bottom-action": "minimal" });

    expect(text).toContain("Checkout");
    expect(text).toContain("Secure checkout is ready.");
    expect(text).toContain("Order composition confirmation");
    expect(text).toContain("Shop: khujand-bakery");
    expect(text).toContain("Somsa × 2 · 15.00 TJS");
    expect(text).toContain("Preview total 30.00 TJS");
    expect(text).toContain("Continue to payment");
    expect(actionZone.findByType("button").children).toEqual(["Continue to payment"]);
    expect(bridge.ready).not.toHaveBeenCalled();
    expect(bridge.expand).not.toHaveBeenCalled();
  });

  it("renders localized checkout baseline copy for the selected language", async () => {
    const renderer = await renderRoute(undefined, createLanguageController("ru"));

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Оформление заказа");
    expect(text).toContain("Безопасное оформление заказа готово.");
    expect(text).toContain("Перейти к оплате");
  });

  it("shows the mock payment affordance only for backend-available checkout with composition", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: true,
      }),
      authenticateTelegram: jest.fn(),
      syncLanguagePreference: jest.fn(),
      submitCheckout: jest.fn(),
    };

    const checkoutRenderer = await renderRoute({ api, bridge: createBridge("query_id=raw") });
    const recoveryRenderer = await renderRoute(
      { api, bridge: createBridge("query_id=raw") },
      createLanguageController("en"),
      null,
    );

    const checkoutText = collectText(checkoutRenderer.toJSON()).join(" ");
    const recoveryText = collectText(recoveryRenderer.toJSON()).join(" ");

    expect(checkoutText).toContain("E2E mock payment is active.");
    expect(checkoutText).toContain("The backend mock provider is available.");
    expect(recoveryText).not.toContain("E2E mock payment is active.");
    expect(api.authenticateTelegram).not.toHaveBeenCalled();
    expect(api.submitCheckout).not.toHaveBeenCalled();
  });

  it("recovers direct checkout access without a composition draft", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn(),
      syncLanguagePreference: jest.fn(),
      submitCheckout: jest.fn(),
    };

    const renderer = await renderRoute({ api, bridge: createBridge("query_id=raw") }, createLanguageController("en"), null);

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Build your cart in the catalog first.");
    expect(text).toContain(
      "Checkout opens only from a non-empty cart. Return to the catalog and choose products before payment.",
    );
    expect(text).toContain("Return to catalog");
    expect(api.authenticateTelegram).not.toHaveBeenCalled();
    expect(api.submitCheckout).not.toHaveBeenCalled();
  });

  it("completes checkout through Telegram auth and backend checkout calls", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn().mockResolvedValue({
        transport: "httpOnlyCookie",
        requiresOriginCheck: true,
        telegramId: "42",
      }),
      syncLanguagePreference: jest.fn().mockResolvedValue(undefined),
      submitCheckout: jest.fn().mockResolvedValue({
        orderId: "order-1",
        paymentStatus: "PAID",
        updatedAt: "2026-04-26T00:00:00.000Z",
        revision: "101",
        confirmationLabel: "Order created after trusted payment confirmation.",
      }),
    };
    const bridge = createBridge("query_id=raw");

    const renderer = await renderRoute({ api, bridge }, createLanguageController("tj"));

    await act(async () => {
      renderer.root.findByType("button").props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Пардохт анҷом ёфт.");
    expect(text).toContain("Order created after trusted payment confirmation.");
    expect(text).toContain("Ҳолати фармоишро пайгирӣ кунед");
    expect(text).toContain("Фармоиш order-1 аз revision 101 барои пайгирӣ омода аст.");
    expect(
      renderer.root.findAllByType("a").some((link) => link.props.href === "/tracking?orderId=order-1&cursor=101"),
    ).toBe(true);
    expect(api.authenticateTelegram).toHaveBeenCalledWith("query_id=raw");
    expect(api.syncLanguagePreference).toHaveBeenCalledWith({
      telegramId: "42",
      language: "tj",
    });
    expect(api.submitCheckout).toHaveBeenCalledWith(composition);
    expect(api.submitCheckout).toHaveBeenCalledTimes(1);
  });

  it("renders a controlled retry state when backend checkout fails", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn().mockResolvedValue({
        transport: "httpOnlyCookie",
        requiresOriginCheck: true,
        telegramId: "42",
      }),
      syncLanguagePreference: jest.fn().mockResolvedValue(undefined),
      submitCheckout: jest
        .fn()
        .mockRejectedValue(
          new CheckoutPaymentApiError(
            "CONFLICT",
            "Payment confirmation timed out.",
            true,
            "retry_checkout",
          ),
        ),
    };
    const bridge = createBridge("query_id=raw");

    const renderer = await renderRoute({ api, bridge });

    await act(async () => {
      renderer.root.findByType("button").props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Payment confirmation timed out.");
    expect(text).toContain("Payment was not completed. You can try again.");
    expect(text).toContain("Try payment again");
  });

  it("returns to composition recovery when backend reports stale composition repair", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn().mockResolvedValue({
        transport: "httpOnlyCookie",
        requiresOriginCheck: true,
        telegramId: "42",
      }),
      syncLanguagePreference: jest.fn().mockResolvedValue(undefined),
      submitCheckout: jest
        .fn()
        .mockRejectedValue(
          new CheckoutPaymentApiError(
            "COMPOSITION_REPAIR_REQUIRED",
            "Checkout composition is invalid.",
            false,
            null,
            "repair_composition",
          ),
        ),
    };
    const bridge = createBridge("query_id=raw");
    const renderer = await renderRoute({ api, bridge });

    await act(async () => {
      renderer.root.findByType("button").props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Build your cart in the catalog first.");
    expect(text).toContain("Return to catalog");
  });

  it("blocks checkout outside Telegram and avoids backend auth/payment calls", async () => {
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn(),
      syncLanguagePreference: jest.fn(),
      submitCheckout: jest.fn(),
    };
    const bridge = createBridge(null);

    const renderer = await renderRoute({ api, bridge });

    await act(async () => {
      renderer.root.findByType("button").props.onClick();
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Open this checkout from Telegram to continue securely.");
    expect(api.authenticateTelegram).not.toHaveBeenCalled();
    expect(api.syncLanguagePreference).not.toHaveBeenCalled();
    expect(api.submitCheckout).not.toHaveBeenCalled();
  });

  it("does not show mock affordance or bypass backend from frontend-only debug state", async () => {
    const debugGlobal = globalThis as typeof globalThis & { __APP_DEBUG__?: boolean };
    const previousDebugValue = debugGlobal.__APP_DEBUG__;
    const api = {
      loadCheckoutBootstrap: async () => ({
        headline: "Checkout",
        statusLabel: "Secure checkout is ready.",
        supportingNotes: ["Order creation stays server-side only."],
        primaryActionLabel: "Continue to payment",
        mockPaymentAvailable: false,
      }),
      authenticateTelegram: jest.fn().mockResolvedValue({
        transport: "httpOnlyCookie",
        requiresOriginCheck: true,
        telegramId: "42",
      }),
      syncLanguagePreference: jest.fn().mockResolvedValue(undefined),
      submitCheckout: jest
        .fn()
        .mockRejectedValue(
          new CheckoutPaymentApiError(
            "PAYMENT_PROVIDER_UNAVAILABLE",
            "Checkout payment provider is not configured.",
          ),
        ),
    };

    try {
      debugGlobal.__APP_DEBUG__ = true;
      const renderer = await renderRoute({ api, bridge: createBridge("query_id=raw") });

      expect(collectText(renderer.toJSON()).join(" ")).not.toContain("E2E mock payment is active.");

      await act(async () => {
        renderer.root.findByType("button").props.onClick();
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Checkout payment provider is not configured.");
      expect(text).not.toContain("Checkout completed.");
      expect(api.submitCheckout).toHaveBeenCalledWith(composition);
      expect(api.submitCheckout).toHaveBeenCalledTimes(1);
    } finally {
      if (previousDebugValue === undefined) {
        delete debugGlobal.__APP_DEBUG__;
      } else {
        debugGlobal.__APP_DEBUG__ = previousDebugValue;
      }
    }
  });

  it("renders a controlled error state when the bootstrap API fails", async () => {
    const api = {
      loadCheckoutBootstrap: async () => {
        throw new Error("Checkout bootstrap failed.");
      },
      authenticateTelegram: jest.fn(),
      syncLanguagePreference: jest.fn(),
      submitCheckout: jest.fn(),
    };
    const renderer = await renderRoute({ api });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Checkout bootstrap failed.");
  });
});
