import {
  createTelegramLanguageStorage,
  createTelegramWebAppBridge,
} from "../../../shared/telegram/webapp";

describe("telegram webapp bridge", () => {
  it("wraps Telegram storage access behind shared language helpers", async () => {
    const storageCalls: string[] = [];
    const languageStorage = createTelegramLanguageStorage({
      getItem: async (key) => {
        storageCalls.push(`get:${key}`);
        return " tj ";
      },
      setItem: async (key, value) => {
        storageCalls.push(`set:${key}:${value}`);
      },
    });

    await expect(languageStorage.getLanguage()).resolves.toBe(" tj ");
    await expect(languageStorage.setLanguage("en")).resolves.toBeUndefined();
    expect(storageCalls).toEqual([
      "get:khujandi.language",
      "set:khujandi.language:en",
    ]);
  });

  it("builds a safe bridge when Telegram runtime is available", async () => {
    const calls: string[] = [];
    const handler = jest.fn();
    const bridge = createTelegramWebAppBridge({
      Telegram: {
        WebApp: {
          initData: "  query_id=raw  ",
          colorScheme: "dark",
          viewportHeight: 720,
          viewportStableHeight: 680,
          isExpanded: true,
          ready: () => {
            calls.push("ready");
          },
          expand: () => {
            calls.push("expand");
          },
          isVersionAtLeast: (version) => version === "7.10",
          onEvent: (event, callback) => {
            calls.push(`on:${event}`);
            callback();
          },
          offEvent: (event) => {
            calls.push(`off:${event}`);
          },
          safeAreaInset: {
            top: 8,
            bottom: 20,
          },
          contentSafeAreaInset: {
            left: 4,
            right: 4,
          },
          deviceStorage: {
            getItem: async () => "ru",
            setItem: async (_key, value) => {
              calls.push(`device:${value}`);
            },
          },
          cloudStorage: {
            getItem: async () => "en",
            setItem: async (_key, value) => {
              calls.push(`cloud:${value}`);
            },
          },
          disableVerticalSwipes: () => {
            calls.push("swipe:locked");
          },
          enableVerticalSwipes: () => {
            calls.push("swipe:default");
          },
          BackButton: {
            show: () => {
              calls.push("back:show");
            },
            hide: () => {
              calls.push("back:hide");
            },
          },
        },
      },
    });

    bridge.ready();
    bridge.expand();
    const unsubscribe = bridge.onEvent("themeChanged", handler);

    expect(bridge.getInitData()).toBe("query_id=raw");
    expect(bridge.isAvailable()).toBe(true);
    expect(bridge.isVersionAtLeast("7.10")).toBe(true);
    expect(bridge.isVersionAtLeast("7.11")).toBe(false);
    expect(bridge.getColorScheme()).toBe("dark");
    expect(bridge.getViewport()).toEqual({
      height: 720,
      stableHeight: 680,
      isExpanded: true,
    });
    expect(bridge.getSafeAreaInsets()).toEqual({
      top: 8,
      right: 0,
      bottom: 20,
      left: 0,
    });
    expect(bridge.getContentSafeAreaInsets()).toEqual({
      top: 0,
      right: 4,
      bottom: 0,
      left: 4,
    });
    expect(bridge.getRuntimeSnapshot()).toEqual({
      isAvailable: true,
      colorScheme: "dark",
      viewport: {
        height: 720,
        stableHeight: 680,
        isExpanded: true,
      },
      safeAreaInsets: {
        top: 8,
        right: 0,
        bottom: 20,
        left: 0,
      },
      contentSafeAreaInsets: {
        top: 0,
        right: 4,
        bottom: 0,
        left: 4,
      },
    });
    await expect(bridge.deviceStorage.getLanguage()).resolves.toBe("ru");
    await expect(bridge.cloudStorage.getLanguage()).resolves.toBe("en");

    bridge.setBackButtonVisible(true);
    bridge.setSwipeBehavior("locked");
    bridge.setBackButtonVisible(false);
    bridge.setSwipeBehavior("default");
    await bridge.deviceStorage.setLanguage("tj");
    await bridge.cloudStorage.setLanguage("ru");
    unsubscribe();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([
      "ready",
      "expand",
      "on:themeChanged",
      "back:show",
      "swipe:locked",
      "back:hide",
      "swipe:default",
      "device:tj",
      "cloud:ru",
      "off:themeChanged",
    ]);
  });

  it("degrades to null/no-op behavior when Telegram runtime is absent", async () => {
    const bridge = createTelegramWebAppBridge({});

    expect(bridge.getInitData()).toBeNull();
    expect(bridge.isAvailable()).toBe(false);
    expect(bridge.isVersionAtLeast("7.10")).toBe(false);
    expect(bridge.getColorScheme()).toBe("unknown");
    expect(bridge.getViewport()).toEqual({
      height: null,
      stableHeight: null,
      isExpanded: false,
    });
    expect(bridge.getSafeAreaInsets()).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
    expect(bridge.getRuntimeSnapshot()).toEqual({
      isAvailable: false,
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
    });
    await expect(bridge.deviceStorage.getLanguage()).resolves.toBeNull();
    await expect(bridge.cloudStorage.setLanguage("ru")).resolves.toBeUndefined();
    expect(bridge.setBackButtonVisible(true)).toBeUndefined();
    expect(bridge.setSwipeBehavior("locked")).toBeUndefined();
    expect(bridge.onEvent("activated", jest.fn())()).toBeUndefined();
  });
});
