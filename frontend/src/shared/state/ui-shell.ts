export type UiShellTheme = "light" | "dark" | "unknown";

export type UiShellLifecycle = "active" | "inactive";

export type UiShellInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type UiShellViewport = {
  height: number | null;
  stableHeight: number | null;
};

export type UiShellDegradationMode = "enhanced" | "minimal";

export type UiShellBottomActionLayout = "keyboard-safe" | "inline";

export type UiShellNativeChromeMode = "enabled" | "disabled";

export type UiShellCapabilities = {
  degradationMode: UiShellDegradationMode;
  bottomActionLayout: UiShellBottomActionLayout;
  nativeChrome: UiShellNativeChromeMode;
};

export type UiShellState = {
  isReady: boolean;
  isExpanded: boolean;
  isTelegramEnvironment: boolean;
  theme: UiShellTheme;
  lifecycle: UiShellLifecycle;
  viewport: UiShellViewport;
  safeArea: UiShellInsets;
  contentSafeArea: UiShellInsets;
  capabilities: UiShellCapabilities;
};

export type UiShellStateInput = Partial<Omit<UiShellState, "viewport" | "safeArea" | "contentSafeArea">> & {
  viewport?: Partial<UiShellViewport>;
  safeArea?: Partial<UiShellInsets>;
  contentSafeArea?: Partial<UiShellInsets>;
  capabilities?: Partial<UiShellCapabilities>;
};

export type UiShellRuntimePatch = UiShellStateInput;

const createUiShellInsets = (value: Partial<UiShellInsets> = {}): UiShellInsets => ({
  top: value.top ?? 0,
  right: value.right ?? 0,
  bottom: value.bottom ?? 0,
  left: value.left ?? 0,
});

const createUiShellViewport = (value: Partial<UiShellViewport> = {}): UiShellViewport => ({
  height: value.height ?? null,
  stableHeight: value.stableHeight ?? null,
});

const createUiShellCapabilities = (value: Partial<UiShellCapabilities> = {}): UiShellCapabilities => ({
  degradationMode: value.degradationMode ?? "minimal",
  bottomActionLayout: value.bottomActionLayout ?? "inline",
  nativeChrome: value.nativeChrome ?? "disabled",
});

export type UiShellRuntimeCapabilitiesInput = {
  isTelegramEnvironment: boolean;
  supportsEnhancedShell: boolean;
  supportsKeyboardSafeBottomActions: boolean;
  supportsNativeChrome: boolean;
};

export const deriveUiShellCapabilities = ({
  isTelegramEnvironment,
  supportsEnhancedShell,
  supportsKeyboardSafeBottomActions,
  supportsNativeChrome,
}: UiShellRuntimeCapabilitiesInput): UiShellCapabilities => ({
  degradationMode: isTelegramEnvironment && supportsEnhancedShell ? "enhanced" : "minimal",
  bottomActionLayout:
    isTelegramEnvironment && supportsKeyboardSafeBottomActions ? "keyboard-safe" : "inline",
  nativeChrome: isTelegramEnvironment && supportsNativeChrome ? "enabled" : "disabled",
});

export const createUiShellState = (value: UiShellStateInput = {}): UiShellState => ({
  isReady: value.isReady ?? false,
  isExpanded: value.isExpanded ?? false,
  isTelegramEnvironment: value.isTelegramEnvironment ?? false,
  theme: value.theme ?? "unknown",
  lifecycle: value.lifecycle ?? "active",
  viewport: createUiShellViewport(value.viewport),
  safeArea: createUiShellInsets(value.safeArea),
  contentSafeArea: createUiShellInsets(value.contentSafeArea),
  capabilities: createUiShellCapabilities(value.capabilities),
});

export const mergeUiShellState = (
  currentState: UiShellState,
  patch: UiShellRuntimePatch = {},
): UiShellState =>
  createUiShellState({
    ...currentState,
    ...patch,
    viewport: {
      ...currentState.viewport,
      ...patch.viewport,
    },
    safeArea: {
      ...currentState.safeArea,
      ...patch.safeArea,
    },
    contentSafeArea: {
      ...currentState.contentSafeArea,
      ...patch.contentSafeArea,
    },
    capabilities: {
      ...currentState.capabilities,
      ...patch.capabilities,
    },
  });
