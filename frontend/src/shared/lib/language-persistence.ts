import {
  defaultLanguage,
  parseSupportedLanguage,
  type SupportedLanguage,
} from "../i18n/languages";
import type { TelegramLanguageStorage, TelegramWebAppBridge } from "../telegram/webapp";

export type BrowserLanguageStorage = {
  getLanguage: () => string | null;
  setLanguage: (language: SupportedLanguage) => void;
};

export type LanguagePersistence = {
  read: () => Promise<{
    language: SupportedLanguage;
    hasPersistedLanguage: boolean;
  }>;
  write: (language: SupportedLanguage) => Promise<void>;
};

type LanguageReadResult = {
  language: SupportedLanguage;
  hasPersistedLanguage: boolean;
};

const createLocalStorageLanguageStorage = (): BrowserLanguageStorage => ({
  getLanguage: () => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("khujandi.language");
  },
  setLanguage: (language) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("khujandi.language", language);
  },
});

type LanguagePersistenceDependencies = {
  deviceStorage: TelegramLanguageStorage;
  cloudStorage: TelegramLanguageStorage;
  browserStorage?: BrowserLanguageStorage;
};

const resolveStoredLanguage = (value: string | null): LanguageReadResult | null => {
  if (value === null) {
    return null;
  }

  const supportedLanguage = parseSupportedLanguage(value);

  if (supportedLanguage !== null) {
    return {
      language: supportedLanguage,
      hasPersistedLanguage: true,
    };
  }

  return {
    language: defaultLanguage,
    hasPersistedLanguage: false,
  };
};

const readStorageLanguage = async (readLanguage: () => string | null | Promise<string | null>): Promise<string | null> => {
  try {
    return await readLanguage();
  } catch {
    return null;
  }
};

const writeStorageLanguage = async (
  writeLanguage: (language: SupportedLanguage) => void | Promise<void>,
  language: SupportedLanguage,
): Promise<boolean> => {
  try {
    await writeLanguage(language);
    return true;
  } catch {
    return false;
  }
};

export const createLanguagePersistence = ({
  deviceStorage,
  cloudStorage,
  browserStorage = createLocalStorageLanguageStorage(),
}: LanguagePersistenceDependencies): LanguagePersistence => ({
  read: async () => {
    const resolvedDeviceLanguage = resolveStoredLanguage(await readStorageLanguage(deviceStorage.getLanguage));

    if (resolvedDeviceLanguage !== null) {
      return resolvedDeviceLanguage;
    }

    const resolvedCloudLanguage = resolveStoredLanguage(await readStorageLanguage(cloudStorage.getLanguage));

    if (resolvedCloudLanguage !== null) {
      return resolvedCloudLanguage;
    }

    const resolvedBrowserLanguage = resolveStoredLanguage(await readStorageLanguage(browserStorage.getLanguage));

    return resolvedBrowserLanguage ?? {
      language: defaultLanguage,
      hasPersistedLanguage: false,
    };
  },
  write: async (language) => {
    const deviceWritten = await writeStorageLanguage(deviceStorage.setLanguage, language);
    const cloudWritten = await writeStorageLanguage(cloudStorage.setLanguage, language);
    const browserWritten = await writeStorageLanguage(browserStorage.setLanguage, language);

    if (!deviceWritten && !cloudWritten && !browserWritten) {
      throw new Error("Unable to persist the selected language in any storage layer.");
    }
  },
});

export const createTelegramLanguagePersistence = (
  bridge: TelegramWebAppBridge,
  browserStorage?: BrowserLanguageStorage,
): LanguagePersistence =>
  createLanguagePersistence({
    deviceStorage: bridge.deviceStorage,
    cloudStorage: bridge.cloudStorage,
    browserStorage,
  });
