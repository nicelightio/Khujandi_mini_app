import type { SupportedLanguage } from "../i18n/languages";

const languageStorageKey = "khujandi.language";

export type TelegramColorScheme = "light" | "dark" | "unknown";

export type TelegramViewportState = {
  height: number | null;
  stableHeight: number | null;
  isExpanded: boolean;
};

export type TelegramInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type TelegramWebAppEvent =
  | "themeChanged"
  | "viewportChanged"
  | "safeAreaChanged"
  | "contentSafeAreaChanged"
  | "activated"
  | "deactivated";

export type TelegramSwipeBehavior = "default" | "locked";

export type TelegramLanguageStorage = {
  getLanguage: () => Promise<string | null>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

type TelegramStorageBackend = {
  getItem?: (key: string) => string | null | undefined | Promise<string | null | undefined>;
  setItem?: (key: string, value: string) => void | Promise<void>;
};

type TelegramInsetsInput = Partial<Record<keyof TelegramInsets, number | null | undefined>>;

type TelegramWebAppRuntime = {
  initData?: string | null;
  version?: string | null;
  colorScheme?: string | null;
  viewportHeight?: number | null;
  viewportStableHeight?: number | null;
  isExpanded?: boolean;
  ready?: () => void;
  expand?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  onEvent?: (event: TelegramWebAppEvent, handler: () => void) => void;
  offEvent?: (event: TelegramWebAppEvent, handler: () => void) => void;
  safeAreaInset?: TelegramInsetsInput;
  contentSafeAreaInset?: TelegramInsetsInput;
  deviceStorage?: TelegramStorageBackend;
  cloudStorage?: TelegramStorageBackend;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  BackButton?: {
    show?: () => void;
    hide?: () => void;
  };
};

type TelegramWindowLike = {
  Telegram?: {
    WebApp?: TelegramWebAppRuntime;
  };
};

export type TelegramWebAppBridge = {
  ready: () => void;
  expand: () => void;
  getInitData: () => string | null;
  isAvailable: () => boolean;
  isVersionAtLeast: (version: string) => boolean;
  getColorScheme: () => TelegramColorScheme;
  getViewport: () => TelegramViewportState;
  getSafeAreaInsets: () => TelegramInsets;
  getContentSafeAreaInsets: () => TelegramInsets;
  getRuntimeSnapshot: () => {
    isAvailable: boolean;
    colorScheme: TelegramColorScheme;
    viewport: TelegramViewportState;
    safeAreaInsets: TelegramInsets;
    contentSafeAreaInsets: TelegramInsets;
  };
  onEvent: (event: TelegramWebAppEvent, handler: () => void) => () => void;
  setBackButtonVisible: (visible: boolean) => void;
  setSwipeBehavior: (behavior: TelegramSwipeBehavior) => void;
  deviceStorage: TelegramLanguageStorage;
  cloudStorage: TelegramLanguageStorage;
};

export const createTelegramLanguageStorage = (
  storage?: TelegramStorageBackend,
): TelegramLanguageStorage => ({
  getLanguage: async () => {
    const rawValue = await storage?.getItem?.(languageStorageKey);

    return typeof rawValue === "string" ? rawValue : null;
  },
  setLanguage: async (language) => {
    await storage?.setItem?.(languageStorageKey, language);
  },
});

const getTelegramWebAppRuntime = (windowLike?: TelegramWindowLike): TelegramWebAppRuntime | undefined => {
  if (windowLike !== undefined) {
    return windowLike.Telegram?.WebApp;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as typeof window & TelegramWindowLike).Telegram?.WebApp;
};

const toInsetValue = (value: number | null | undefined): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const createInsets = (value?: TelegramInsetsInput): TelegramInsets => ({
  top: toInsetValue(value?.top),
  right: toInsetValue(value?.right),
  bottom: toInsetValue(value?.bottom),
  left: toInsetValue(value?.left),
});

const normalizeColorScheme = (value: string | null | undefined): TelegramColorScheme => {
  if (value === "light" || value === "dark") {
    return value;
  }

  return "unknown";
};

const toViewportValue = (value: number | null | undefined): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const createTelegramWebAppBridge = (windowLike?: TelegramWindowLike): TelegramWebAppBridge => {
  const webApp = getTelegramWebAppRuntime(windowLike);

  const getViewport = (): TelegramViewportState => ({
    height: toViewportValue(webApp?.viewportHeight),
    stableHeight: toViewportValue(webApp?.viewportStableHeight),
    isExpanded: webApp?.isExpanded ?? false,
  });

  const getSafeAreaInsets = (): TelegramInsets => createInsets(webApp?.safeAreaInset);

  const getContentSafeAreaInsets = (): TelegramInsets => createInsets(webApp?.contentSafeAreaInset);

  return {
    ready: () => {
      webApp?.ready?.();
    },
    expand: () => {
      webApp?.expand?.();
    },
    getInitData: () => {
      const initData = webApp?.initData?.trim();

      return initData ? initData : null;
    },
    isAvailable: () => webApp !== undefined,
    isVersionAtLeast: (version) => webApp?.isVersionAtLeast?.(version) ?? false,
    getColorScheme: () => normalizeColorScheme(webApp?.colorScheme),
    getViewport,
    getSafeAreaInsets,
    getContentSafeAreaInsets,
    getRuntimeSnapshot: () => ({
      isAvailable: webApp !== undefined,
      colorScheme: normalizeColorScheme(webApp?.colorScheme),
      viewport: getViewport(),
      safeAreaInsets: getSafeAreaInsets(),
      contentSafeAreaInsets: getContentSafeAreaInsets(),
    }),
    onEvent: (event, handler) => {
      webApp?.onEvent?.(event, handler);

      return () => {
        webApp?.offEvent?.(event, handler);
      };
    },
    setBackButtonVisible: (visible) => {
      if (visible) {
        webApp?.BackButton?.show?.();
        return;
      }

      webApp?.BackButton?.hide?.();
    },
    setSwipeBehavior: (behavior) => {
      if (behavior === "locked") {
        webApp?.disableVerticalSwipes?.();
        return;
      }

      webApp?.enableVerticalSwipes?.();
    },
    deviceStorage: createTelegramLanguageStorage(webApp?.deviceStorage),
    cloudStorage: createTelegramLanguageStorage(webApp?.cloudStorage),
  };
};
