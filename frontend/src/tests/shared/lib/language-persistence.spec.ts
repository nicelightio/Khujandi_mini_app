import { createLanguagePersistence, type BrowserLanguageStorage } from "../../../shared/lib/language-persistence";
import type { TelegramLanguageStorage } from "../../../shared/telegram/webapp";

describe("language persistence", () => {
  it("reads device, cloud, then browser storage in order", async () => {
    const calls: string[] = [];
    const deviceStorage: TelegramLanguageStorage = {
      getLanguage: async () => {
        calls.push("device");
        return null;
      },
      setLanguage: async () => undefined,
    };
    const cloudStorage: TelegramLanguageStorage = {
      getLanguage: async () => {
        calls.push("cloud");
        return "en";
      },
      setLanguage: async () => undefined,
    };
    const browserStorage: BrowserLanguageStorage = {
      getLanguage: () => {
        calls.push("browser");
        return "tj";
      },
      setLanguage: () => undefined,
    };

    const persistence = createLanguagePersistence({
      deviceStorage,
      cloudStorage,
      browserStorage,
    });

    await expect(persistence.read()).resolves.toEqual({
      language: "en",
      hasPersistedLanguage: true,
    });
    expect(calls).toEqual(["device", "cloud"]);
  });

  it("preserves an explicit default-language choice instead of treating it as missing", async () => {
    const persistence = createLanguagePersistence({
      deviceStorage: {
        getLanguage: async () => "ru",
        setLanguage: async () => undefined,
      },
      cloudStorage: {
        getLanguage: async () => null,
        setLanguage: async () => undefined,
      },
      browserStorage: {
        getLanguage: () => null,
        setLanguage: () => undefined,
      },
    });

    await expect(persistence.read()).resolves.toEqual({
      language: "ru",
      hasPersistedLanguage: true,
    });
  });

  it("treats unsupported persisted values as fallback-only and keeps the preference unresolved", async () => {
    const persistence = createLanguagePersistence({
      deviceStorage: {
        getLanguage: async () => "de",
        setLanguage: async () => undefined,
      },
      cloudStorage: {
        getLanguage: async () => "en",
        setLanguage: async () => undefined,
      },
      browserStorage: {
        getLanguage: () => "tj",
        setLanguage: () => undefined,
      },
    });

    await expect(persistence.read()).resolves.toEqual({
      language: "ru",
      hasPersistedLanguage: false,
    });
  });

  it("falls through to lower-priority storage when a higher-priority layer is unavailable", async () => {
    const calls: string[] = [];
    const persistence = createLanguagePersistence({
      deviceStorage: {
        getLanguage: async () => {
          calls.push("device");
          throw new Error("device unavailable");
        },
        setLanguage: async () => undefined,
      },
      cloudStorage: {
        getLanguage: async () => {
          calls.push("cloud");
          return "en";
        },
        setLanguage: async () => undefined,
      },
      browserStorage: {
        getLanguage: () => {
          calls.push("browser");
          return "tj";
        },
        setLanguage: () => undefined,
      },
    });

    await expect(persistence.read()).resolves.toEqual({
      language: "en",
      hasPersistedLanguage: true,
    });
    expect(calls).toEqual(["device", "cloud"]);
  });

  it("writes through every persistence layer", async () => {
    const calls: string[] = [];
    const createStorage = (name: string): TelegramLanguageStorage => ({
      getLanguage: async () => null,
      setLanguage: async (language) => {
        calls.push(`${name}:${language}`);
      },
    });
    const browserStorage: BrowserLanguageStorage = {
      getLanguage: () => null,
      setLanguage: (language) => {
        calls.push(`browser:${language}`);
      },
    };

    const persistence = createLanguagePersistence({
      deviceStorage: createStorage("device"),
      cloudStorage: createStorage("cloud"),
      browserStorage,
    });

    await persistence.write("tj");

    expect(calls).toEqual(["device:tj", "cloud:tj", "browser:tj"]);
  });

  it("continues writing through fallback storage when Telegram storage layers fail", async () => {
    const calls: string[] = [];
    const persistence = createLanguagePersistence({
      deviceStorage: {
        getLanguage: async () => null,
        setLanguage: async () => {
          calls.push("device");
          throw new Error("device unavailable");
        },
      },
      cloudStorage: {
        getLanguage: async () => null,
        setLanguage: async () => {
          calls.push("cloud");
          throw new Error("cloud unavailable");
        },
      },
      browserStorage: {
        getLanguage: () => null,
        setLanguage: (language) => {
          calls.push(`browser:${language}`);
        },
      },
    });

    await expect(persistence.write("en")).resolves.toBeUndefined();
    expect(calls).toEqual(["device", "cloud", "browser:en"]);
  });

  it("fails only when every storage layer rejects the write", async () => {
    const persistence = createLanguagePersistence({
      deviceStorage: {
        getLanguage: async () => null,
        setLanguage: async () => {
          throw new Error("device unavailable");
        },
      },
      cloudStorage: {
        getLanguage: async () => null,
        setLanguage: async () => {
          throw new Error("cloud unavailable");
        },
      },
      browserStorage: {
        getLanguage: () => null,
        setLanguage: () => {
          throw new Error("browser unavailable");
        },
      },
    });

    await expect(persistence.write("en")).rejects.toThrow(
      "Unable to persist the selected language in any storage layer.",
    );
  });
});
