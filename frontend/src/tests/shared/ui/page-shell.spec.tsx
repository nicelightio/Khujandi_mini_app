import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AppShell } from "../../../app/app-shell";
import { PageShell } from "../../../shared/ui/page-shell";
import { createTelegramWebAppBridge } from "../../../shared/telegram/webapp";

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

describe("page shell", () => {
  it("renders an optional shell-owned bottom action zone", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(
        <AppShell
          telegramBridge={createTelegramWebAppBridge({
            Telegram: {
              WebApp: {
                viewportStableHeight: 680,
                isVersionAtLeast: () => true,
                onEvent: (_event, _handler) => undefined,
                offEvent: (_event, _handler) => undefined,
                disableVerticalSwipes: () => undefined,
                enableVerticalSwipes: () => undefined,
                BackButton: {
                  show: () => undefined,
                  hide: () => undefined,
                },
              },
            },
          })}
        >
          <PageShell
            title="Checkout"
            actionLabel="Continue to payment"
            bottomAction={<button type="button">Continue to payment</button>}
          >
            <section>
              <p>Body content</p>
            </section>
          </PageShell>
        </AppShell>,
      );
    });

    const footerSection = renderer.root.findByProps({ "data-shell-section": "footer" });
    const actionZone = renderer.root.findByProps({ "data-shell-bottom-action": "enhanced" });
    const button = renderer.root.findByType("button");

    expect(footerSection.props["data-shell-section"]).toBe("footer");
    expect(footerSection.props["data-shell-footer-layout"]).toBe("keyboard-safe");
    expect(actionZone.props["data-shell-bottom-action"]).toBe("enhanced");
    expect(button.children).toEqual(["Continue to payment"]);
  });

  it("keeps minimal keyboard-safe bottom actions when enhanced shell capabilities are unavailable", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(
        <AppShell
          telegramBridge={createTelegramWebAppBridge({
            Telegram: {
              WebApp: {
                viewportStableHeight: null,
                isVersionAtLeast: () => false,
                onEvent: (_event, _handler) => undefined,
                offEvent: (_event, _handler) => undefined,
              },
            },
          })}
        >
          <PageShell title="Checkout" bottomAction={<button type="button">Continue to payment</button>}>
            <section>
              <p>Body content</p>
            </section>
          </PageShell>
        </AppShell>,
      );
    });

    const footerSection = renderer.root.findByProps({ "data-shell-section": "footer" });
    const actionZone = renderer.root.findByProps({ "data-shell-bottom-action": "minimal" });

    expect(footerSection.props["data-shell-footer-layout"]).toBe("keyboard-safe");
    expect(actionZone.props["data-shell-bottom-action"]).toBe("minimal");
  });
});
