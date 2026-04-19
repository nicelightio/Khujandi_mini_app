import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AppShell } from "../../app/app-shell";
import { AppRouter } from "../../app/router";
import type { LanguageController } from "../../shared/state/language";
import { createUiShellState } from "../../shared/state/ui-shell";
import { createTelegramWebAppBridge } from "../../shared/telegram/webapp";

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

describe("app shell", () => {
  it("wraps routed content in the centralized app shell boundary", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AppRouter
          languageController={hydratedLanguageController}
          shellState={createUiShellState({
            isReady: true,
            theme: "dark",
            lifecycle: "inactive",
          })}
        />,
      );
      await flushPromises();
    });

    const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

    expect(shellBoundary.props["data-shell-ready"]).toBe("true");
    expect(shellBoundary.props["data-shell-theme"]).toBe("dark");
    expect(shellBoundary.props["data-shell-lifecycle"]).toBe("inactive");
    expect(shellBoundary.props["data-shell-capability"]).toBe("minimal");
    expect(shellBoundary.findByType("main").props["data-shell"]).toBe("page");
  });

  it("hydrates shell runtime state from the shared Telegram bridge", async () => {
    let renderer!: ReactTestRenderer;
    const backButtonShow = jest.fn();
    const backButtonHide = jest.fn();
    const disableVerticalSwipes = jest.fn();
    const enableVerticalSwipes = jest.fn();

    await act(async () => {
      renderer = create(
        <AppShell
          telegramBridge={createTelegramWebAppBridge({
            Telegram: {
              WebApp: {
                colorScheme: "dark",
                viewportHeight: 720,
                viewportStableHeight: 680,
                isExpanded: true,
                ready: jest.fn(),
                expand: jest.fn(),
                isVersionAtLeast: (version) => version === "7.10",
                onEvent: (_event, _handler) => {
                  return;
                },
                offEvent: (_event, _handler) => {
                  return;
                },
                safeAreaInset: {
                  bottom: 20,
                },
                contentSafeAreaInset: {
                  top: 12,
                },
                disableVerticalSwipes: disableVerticalSwipes,
                enableVerticalSwipes: enableVerticalSwipes,
                BackButton: {
                  show: backButtonShow,
                  hide: backButtonHide,
                },
              },
            },
          })}
        >
          <main data-shell="page">Runtime shell</main>
        </AppShell>,
      );
      await flushPromises();
    });

    const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

    expect(shellBoundary.props["data-shell-ready"]).toBe("true");
    expect(shellBoundary.props["data-shell-theme"]).toBe("dark");
    expect(shellBoundary.props["data-shell-telegram"]).toBe("true");
    expect(shellBoundary.props["data-shell-expanded"]).toBe("true");
    expect(shellBoundary.props["data-shell-viewport-source"]).toBe("stable");
    expect(shellBoundary.props["data-shell-capability"]).toBe("enhanced");
    expect(shellBoundary.props["data-shell-bottom-action-layout"]).toBe("keyboard-safe");
    expect(shellBoundary.props["data-shell-native-chrome"]).toBe("enabled");
    expect(shellBoundary.props.style).toMatchObject({
      "--tg-viewport-height": "720px",
      "--tg-viewport-stable-height": "680px",
      "--tg-safe-area-inset-bottom": "20px",
      "--tg-content-safe-area-inset-top": "12px",
    });
    expect(backButtonHide).toHaveBeenCalled();
    expect(enableVerticalSwipes).toHaveBeenCalled();
  });

  it("reacts to runtime events for theme, viewport, safe-area and lifecycle updates", async () => {
    let renderer!: ReactTestRenderer;
    const eventHandlers: Partial<Record<string, () => void>> = {};
    const runtime: Record<string, unknown> & {
      colorScheme: string;
      viewportHeight: number;
      viewportStableHeight: number;
      isExpanded: boolean;
      safeAreaInset: Record<string, number>;
      contentSafeAreaInset: Record<string, number>;
      ready: jest.Mock;
      expand: jest.Mock;
      isVersionAtLeast: (version: string) => boolean;
      onEvent: (event: string, handler: () => void) => void;
      offEvent: jest.Mock;
      disableVerticalSwipes: jest.Mock;
      enableVerticalSwipes: jest.Mock;
      BackButton: {
        show: jest.Mock;
        hide: jest.Mock;
      };
    } = {
      colorScheme: "light",
      viewportHeight: 720,
      viewportStableHeight: 680,
      isExpanded: false,
      ready: jest.fn(),
      expand: jest.fn(),
      isVersionAtLeast: (version: string) => version === "7.10",
      onEvent: (event: string, handler: () => void) => {
        eventHandlers[event] = handler;
      },
      offEvent: jest.fn(),
      disableVerticalSwipes: jest.fn(),
      enableVerticalSwipes: jest.fn(),
      BackButton: {
        show: jest.fn(),
        hide: jest.fn(),
      },
      safeAreaInset: {
        bottom: 16,
      },
      contentSafeAreaInset: {
        top: 8,
      },
    };

    await act(async () => {
      renderer = create(
        <AppShell telegramBridge={createTelegramWebAppBridge({ Telegram: { WebApp: runtime } })}>
          <main data-shell="page">Runtime shell</main>
        </AppShell>,
      );
      await flushPromises();
    });

    await act(async () => {
      runtime.colorScheme = "dark";
      runtime.viewportHeight = 760;
      runtime.viewportStableHeight = 700;
      runtime.isExpanded = true;
      runtime.safeAreaInset = {
        top: 10,
        bottom: 24,
      };
      runtime.contentSafeAreaInset = {
        top: 12,
        bottom: 6,
      };
      eventHandlers.themeChanged?.();
      eventHandlers.viewportChanged?.();
      eventHandlers.safeAreaChanged?.();
      eventHandlers.contentSafeAreaChanged?.();
      eventHandlers.deactivated?.();
      await flushPromises();
    });

    let shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

    expect(shellBoundary.props["data-shell-theme"]).toBe("dark");
    expect(shellBoundary.props["data-shell-lifecycle"]).toBe("inactive");
    expect(shellBoundary.props["data-shell-expanded"]).toBe("true");
    expect(shellBoundary.props["data-shell-capability"]).toBe("enhanced");
    expect(shellBoundary.props.style).toMatchObject({
      "--tg-viewport-height": "760px",
      "--tg-viewport-stable-height": "700px",
      "--tg-safe-area-inset-top": "10px",
      "--tg-safe-area-inset-bottom": "24px",
      "--tg-content-safe-area-inset-top": "12px",
      "--tg-content-safe-area-inset-bottom": "6px",
    });

    await act(async () => {
      eventHandlers.activated?.();
      await flushPromises();
    });

    shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });
    expect(shellBoundary.props["data-shell-lifecycle"]).toBe("active");
  });

  it("propagates checkout page policy into centralized shell markers", async () => {
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
      const backButtonShow = jest.fn();
      const disableVerticalSwipes = jest.fn();

      await act(async () => {
        renderer = create(
          <AppRouter
            languageController={hydratedLanguageController}
            telegramBridge={createTelegramWebAppBridge({
              Telegram: {
                WebApp: {
                  ready: jest.fn(),
                  expand: jest.fn(),
                  isVersionAtLeast: (version) => version === "7.10",
                  onEvent: (_event, _handler) => {
                    return;
                  },
                  offEvent: (_event, _handler) => {
                    return;
                  },
                  disableVerticalSwipes,
                  enableVerticalSwipes: jest.fn(),
                  BackButton: {
                    show: backButtonShow,
                    hide: jest.fn(),
                  },
                },
              },
            })}
          />,
        );
        await flushPromises();
      });

      const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });
      const page = renderer.root.findByProps({ "data-shell": "page" });

      expect(shellBoundary.props["data-shell-back"]).toBe("visible");
      expect(shellBoundary.props["data-shell-swipe"]).toBe("locked");
      expect(shellBoundary.props["data-shell-action-feedback"]).toBe("idle");
      expect(page.props["data-shell-back"]).toBe("visible");
      expect(page.findByProps({ "data-shell-back-link": "visible" }).props.href).toBe("/");
      expect(backButtonShow).toHaveBeenCalledTimes(1);
      expect(disableVerticalSwipes).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: previousWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("keeps a keyboard-safe bottom action layout on degraded Telegram runtime paths", async () => {
    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <AppShell
          telegramBridge={createTelegramWebAppBridge({
            Telegram: {
              WebApp: {
                viewportHeight: 720,
                viewportStableHeight: null,
                isVersionAtLeast: () => false,
                onEvent: (_event, _handler) => {
                  return;
                },
                offEvent: (_event, _handler) => {
                  return;
                },
              },
            },
          })}
        >
          <main data-shell="page">Runtime shell</main>
        </AppShell>,
      );
      await flushPromises();
    });

    const shellBoundary = renderer.root.findByProps({ "data-app-shell": "root" });

    expect(shellBoundary.props["data-shell-telegram"]).toBe("true");
    expect(shellBoundary.props["data-shell-capability"]).toBe("minimal");
    expect(shellBoundary.props["data-shell-bottom-action-layout"]).toBe("keyboard-safe");
    expect(shellBoundary.props["data-shell-native-chrome"]).toBe("disabled");
  });
});
