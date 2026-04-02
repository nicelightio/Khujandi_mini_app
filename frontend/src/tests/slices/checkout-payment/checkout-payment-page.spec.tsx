import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import { AppShell } from "../../../app/app-shell";
import { CheckoutPaymentPage } from "../../../slices/checkout-payment/components/checkout-payment-page";
import {
  createErrorCheckoutPaymentViewModel,
  createLoadingCheckoutPaymentViewModel,
  createReadyCheckoutPaymentViewModel,
  createSubmittingCheckoutPaymentViewModel,
  createSuccessCheckoutPaymentViewModel,
} from "../../../slices/checkout-payment/model/checkout-payment-view-model";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { createTelegramWebAppBridge } from "../../../shared/telegram/webapp";

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

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

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

const createLanguageContextValue = (language: SupportedLanguage = "en"): LanguageContextValue => ({
  state: {
    language,
    isHydrated: true,
    isOverlayVisible: false,
  },
  controller: {
    getState: () => ({
      language,
      isHydrated: true,
      isOverlayVisible: false,
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
  },
  selectLanguage: async () => undefined,
});

const renderWithLanguage = (
  element: ReturnType<typeof createElement>,
  language: SupportedLanguage = "en",
) =>
  create(
    <LanguageContextProvider value={createLanguageContextValue(language)}>{element}</LanguageContextProvider>,
  );

describe("checkout-payment page", () => {
  it("renders loading, ready and error states for the checkout shell", () => {
    let loadingRenderer!: ReactTestRenderer;
    let readyRenderer!: ReactTestRenderer;
    let errorRenderer!: ReactTestRenderer;

    act(() => {
      loadingRenderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createLoadingCheckoutPaymentViewModel("en"),
          onPrimaryAction: () => undefined,
        }),
        "en",
      );
      readyRenderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createReadyCheckoutPaymentViewModel({
            headline: "Checkout",
            statusLabel: "Secure checkout is ready.",
            supportingNotes: ["Telegram auth is requested only when you start checkout."],
            primaryActionLabel: "Continue to payment",
          }),
          onPrimaryAction: () => undefined,
        }),
        "en",
      );
      errorRenderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createErrorCheckoutPaymentViewModel(
            {
              headline: "Checkout",
              statusLabel: "Secure checkout is ready.",
              supportingNotes: ["Telegram auth is requested only when you start checkout."],
              primaryActionLabel: "Continue to payment",
            },
            "Backend unavailable.",
            "Payment was not completed. You can try again.",
            "en",
          ),
          onPrimaryAction: () => undefined,
        }),
        "en",
      );
    });

    expect(collectText(loadingRenderer.toJSON()).join(" ")).toContain("Preparing checkout session...");
    expect(collectText(readyRenderer.toJSON()).join(" ")).toContain("Secure checkout is ready.");
    expect(collectText(errorRenderer.toJSON()).join(" ")).toContain("Backend unavailable.");
    expect(collectText(errorRenderer.toJSON()).join(" ")).toContain(
      "Payment was not completed. You can try again.",
    );
  });

  it("renders submitting and success states for checkout actions", () => {
    let submittingRenderer!: ReactTestRenderer;
    let successRenderer!: ReactTestRenderer;

    act(() => {
      submittingRenderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createSubmittingCheckoutPaymentViewModel({
            headline: "Checkout",
            statusLabel: "Secure checkout is ready.",
            supportingNotes: ["Telegram auth is requested only when you start checkout."],
            primaryActionLabel: "Continue to payment",
          }, "en"),
          onPrimaryAction: () => undefined,
        }),
        "en",
      );
      successRenderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createSuccessCheckoutPaymentViewModel(
            {
              headline: "Checkout",
              statusLabel: "Secure checkout is ready.",
              supportingNotes: ["Telegram auth is requested only when you start checkout."],
              primaryActionLabel: "Continue to payment",
            },
            "Order created after trusted payment confirmation.",
            "en",
          ),
          onPrimaryAction: () => undefined,
        }),
        "en",
      );
    });

    expect(collectText(submittingRenderer.toJSON()).join(" ")).toContain(
      "Authorizing Telegram and confirming payment...",
    );
    expect(collectText(successRenderer.toJSON()).join(" ")).toContain("Checkout completed.");
    expect(collectText(successRenderer.toJSON()).join(" ")).toContain(
      "Order created after trusted payment confirmation.",
    );
  });

  it("renders localized checkout body copy for the selected language", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CheckoutPaymentPage, {
          viewModel: createLoadingCheckoutPaymentViewModel("ru"),
          onPrimaryAction: () => undefined,
        }),
        "ru",
      );
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Оформление заказа");
    expect(text).toContain("Подготавливаем безопасное оформление заказа...");
  });

  it("surfaces checkout action feedback through the centralized shell boundary", () => {
    let pendingRenderer!: ReactTestRenderer;
    let successRenderer!: ReactTestRenderer;

    act(() => {
      pendingRenderer = create(
        <AppShell telegramBridge={createTelegramWebAppBridge()}>
          <LanguageContextProvider value={createLanguageContextValue("en")}>
            <CheckoutPaymentPage
              viewModel={createSubmittingCheckoutPaymentViewModel(
                {
                  headline: "Checkout",
                  statusLabel: "Secure checkout is ready.",
                  supportingNotes: ["Telegram auth is requested only when you start checkout."],
                  primaryActionLabel: "Continue to payment",
                },
                "en",
              )}
              onPrimaryAction={() => undefined}
            />
          </LanguageContextProvider>
        </AppShell>,
      );
      successRenderer = create(
        <AppShell telegramBridge={createTelegramWebAppBridge()}>
          <LanguageContextProvider value={createLanguageContextValue("en")}>
            <CheckoutPaymentPage
              viewModel={createSuccessCheckoutPaymentViewModel(
                {
                  headline: "Checkout",
                  statusLabel: "Secure checkout is ready.",
                  supportingNotes: ["Telegram auth is requested only when you start checkout."],
                  primaryActionLabel: "Continue to payment",
                },
                "Order created after trusted payment confirmation.",
                "en",
              )}
              onPrimaryAction={() => undefined}
            />
          </LanguageContextProvider>
        </AppShell>,
      );
    });

    expect(pendingRenderer.root.findByProps({ "data-app-shell": "root" }).props).toMatchObject({
      "data-shell-back": "visible",
      "data-shell-swipe": "locked",
      "data-shell-action-feedback": "pending",
    });
    expect(successRenderer.root.findByProps({ "data-app-shell": "root" }).props).toMatchObject({
      "data-shell-back": "visible",
      "data-shell-swipe": "locked",
      "data-shell-action-feedback": "disabled",
    });
  });
});
