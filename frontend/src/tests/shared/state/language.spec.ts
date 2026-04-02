import { createLanguageController, createLanguageState } from "../../../shared/state/language";
import type { LanguagePersistence } from "../../../shared/lib/language-persistence";

describe("language controller", () => {
  it("starts with the default unresolved language state", () => {
    expect(createLanguageState()).toEqual({
      language: "ru",
      isHydrated: false,
      isOverlayVisible: true,
    });
  });

  it("keeps the overlay visible when persistence resolves only the fallback language", async () => {
    const controller = createLanguageController({
      read: async () => ({
        language: "ru",
        hasPersistedLanguage: false,
      }),
      write: async () => undefined,
    } satisfies LanguagePersistence);

    await expect(controller.hydrate()).resolves.toEqual({
      language: "ru",
      isHydrated: true,
      isOverlayVisible: true,
    });
  });

  it("hides the overlay when persistence resolves an explicit choice, including ru", async () => {
    const controller = createLanguageController({
      read: async () => ({
        language: "ru",
        hasPersistedLanguage: true,
      }),
      write: async () => undefined,
    } satisfies LanguagePersistence);

    await expect(controller.hydrate()).resolves.toEqual({
      language: "ru",
      isHydrated: true,
      isOverlayVisible: false,
    });
  });

  it("persists the selected language and closes the overlay", async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const controller = createLanguageController({
      read: async () => ({
        language: "ru",
        hasPersistedLanguage: false,
      }),
      write,
    } satisfies LanguagePersistence);

    await expect(controller.selectLanguage("tj")).resolves.toEqual({
      language: "tj",
      isHydrated: true,
      isOverlayVisible: false,
    });
    expect(write).toHaveBeenCalledWith("tj");
  });
});
