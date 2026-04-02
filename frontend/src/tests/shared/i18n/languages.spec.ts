import {
  defaultLanguage,
  normalizeLanguage,
  parseSupportedLanguage,
} from "../../../shared/i18n/languages";

describe("language normalization", () => {
  it("keeps supported language values", () => {
    expect(normalizeLanguage("en")).toBe("en");
  });

  it("falls back to the default language for unsupported values", () => {
    expect(normalizeLanguage("de")).toBe(defaultLanguage);
    expect(normalizeLanguage(" ")).toBe(defaultLanguage);
    expect(normalizeLanguage(null)).toBe(defaultLanguage);
  });

  it("treats unsupported persisted values as invalid explicit preferences", () => {
    expect(parseSupportedLanguage("de")).toBeNull();
    expect(parseSupportedLanguage(" ")).toBeNull();
    expect(parseSupportedLanguage(undefined)).toBeNull();
  });
});
