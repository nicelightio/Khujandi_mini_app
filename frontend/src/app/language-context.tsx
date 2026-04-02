import { createContext, useContext } from "react";
import type { SupportedLanguage } from "../shared/i18n/languages";
import type { LanguageController, LanguageState } from "../shared/state/language";

export type LanguageContextValue = {
  state: LanguageState;
  controller: LanguageController;
  selectLanguage: (language: SupportedLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageContextProvider = LanguageContext.Provider;

export const useLanguageContext = (): LanguageContextValue => {
  const value = useContext(LanguageContext);

  if (value === null) {
    throw new Error("Language context is unavailable outside LocalizationBoundary.");
  }

  return value;
};
