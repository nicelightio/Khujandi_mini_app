import { createUiShellState, deriveUiShellCapabilities, mergeUiShellState } from "../../../shared/state/ui-shell";

describe("ui shell state", () => {
  it("creates a stable technical default scaffold", () => {
    expect(createUiShellState()).toEqual({
      isReady: false,
      isExpanded: false,
      isTelegramEnvironment: false,
      theme: "unknown",
      lifecycle: "active",
      viewport: {
        height: null,
        stableHeight: null,
      },
      safeArea: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      contentSafeArea: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      capabilities: {
        degradationMode: "minimal",
        bottomActionLayout: "inline",
        nativeChrome: "disabled",
      },
    });
  });

  it("allows later runtime tasks to override nested shell snapshots without reshaping consumers", () => {
    expect(
      createUiShellState({
        isReady: true,
        isTelegramEnvironment: true,
        theme: "dark",
        viewport: {
          stableHeight: 640,
        },
        safeArea: {
          bottom: 24,
        },
      }),
    ).toEqual({
      isReady: true,
      isExpanded: false,
      isTelegramEnvironment: true,
      theme: "dark",
      lifecycle: "active",
      viewport: {
        height: null,
        stableHeight: 640,
      },
      safeArea: {
        top: 0,
        right: 0,
        bottom: 24,
        left: 0,
      },
      contentSafeArea: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      capabilities: {
        degradationMode: "minimal",
        bottomActionLayout: "inline",
        nativeChrome: "disabled",
      },
    });
  });

  it("merges runtime patches without dropping existing nested shell values", () => {
    expect(
      mergeUiShellState(
        createUiShellState({
          isReady: true,
          theme: "dark",
          viewport: {
            stableHeight: 640,
          },
          safeArea: {
            bottom: 24,
          },
        }),
        {
          lifecycle: "inactive",
          viewport: {
            height: 700,
          },
          contentSafeArea: {
            top: 12,
          },
        },
      ),
    ).toEqual({
      isReady: true,
      isExpanded: false,
      isTelegramEnvironment: false,
      theme: "dark",
      lifecycle: "inactive",
      viewport: {
        height: 700,
        stableHeight: 640,
      },
      safeArea: {
        top: 0,
        right: 0,
        bottom: 24,
        left: 0,
      },
      contentSafeArea: {
        top: 12,
        right: 0,
        bottom: 0,
        left: 0,
      },
      capabilities: {
        degradationMode: "minimal",
        bottomActionLayout: "inline",
        nativeChrome: "disabled",
      },
    });
  });

  it("derives a centralized shell degradation policy from runtime capabilities", () => {
    expect(
      deriveUiShellCapabilities({
        isTelegramEnvironment: true,
        supportsEnhancedShell: true,
        supportsKeyboardSafeBottomActions: true,
        supportsNativeChrome: true,
      }),
    ).toEqual({
      degradationMode: "enhanced",
      bottomActionLayout: "keyboard-safe",
      nativeChrome: "enabled",
    });

    expect(
      deriveUiShellCapabilities({
        isTelegramEnvironment: true,
        supportsEnhancedShell: false,
        supportsKeyboardSafeBottomActions: true,
        supportsNativeChrome: true,
      }),
    ).toEqual({
      degradationMode: "minimal",
      bottomActionLayout: "keyboard-safe",
      nativeChrome: "enabled",
    });
  });
});
