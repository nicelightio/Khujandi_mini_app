import { useEffect, useState, type ReactNode } from "react";
import { LanguageContextProvider } from "./language-context";
import { getCopy } from "../shared/i18n/copy";
import { supportedLanguages, type SupportedLanguage } from "../shared/i18n/languages";
import type { LanguageController, LanguageState } from "../shared/state/language";

type LocalizationBoundaryProps = {
  controller: LanguageController;
  children: ReactNode;
};

export const LocalizationBoundary = ({ controller, children }: LocalizationBoundaryProps) => {
  const [state, setState] = useState<LanguageState>(controller.getState());
  const copy = getCopy(state.language);

  useEffect(() => {
    let isMounted = true;

    void controller.hydrate().then((nextState) => {
      if (isMounted) {
        setState(nextState);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [controller]);

  const selectLanguage = async (language: SupportedLanguage) => {
    setState(await controller.selectLanguage(language));
  };

  if (!state.isHydrated) {
    return <div data-language-boundary="loading">Preparing language settings...</div>;
  }

  return (
    <LanguageContextProvider
      value={{
        state,
        controller,
        selectLanguage,
      }}
    >
      <div data-language={state.language}>
        {state.isOverlayVisible ? (
          <section aria-label="Language selection" data-language-overlay="visible">
            <h1>{copy.languageOverlay.title}</h1>
            <p>{copy.languageOverlay.description}</p>
            <div>
              {supportedLanguages.map((language) => (
                <button key={language} type="button" onClick={() => void selectLanguage(language)}>
                  {copy.languageOverlay.options[language]}
                </button>
              ))}
            </div>
          </section>
        ) : (
          children
        )}
      </div>
    </LanguageContextProvider>
  );
};
