import type { SupportedLanguage } from "../i18n/languages";
import type { LanguagePersistence } from "../lib/language-persistence";

export type LanguageState = {
  language: SupportedLanguage;
  isHydrated: boolean;
  isOverlayVisible: boolean;
};

export type LanguageController = {
  getState: () => LanguageState;
  hydrate: () => Promise<LanguageState>;
  selectLanguage: (language: SupportedLanguage) => Promise<LanguageState>;
};

export const createLanguageState = (): LanguageState => ({
  language: "ru",
  isHydrated: false,
  isOverlayVisible: true,
});

export const createLanguageController = (persistence: LanguagePersistence): LanguageController => {
  let state = createLanguageState();

  return {
    getState: () => state,
    hydrate: async () => {
      const { language, hasPersistedLanguage } = await persistence.read();

      state = {
        language,
        isHydrated: true,
        isOverlayVisible: !hasPersistedLanguage,
      };

      return state;
    },
    selectLanguage: async (language) => {
      await persistence.write(language);

      state = {
        language,
        isHydrated: true,
        isOverlayVisible: false,
      };

      return state;
    },
  };
};
