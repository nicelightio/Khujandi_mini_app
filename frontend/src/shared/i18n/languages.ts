export const supportedLanguages = ["ru", "en", "tj"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = "ru";

export const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  supportedLanguages.includes(value as SupportedLanguage);

export const parseSupportedLanguage = (
  value: string | null | undefined,
): SupportedLanguage | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return isSupportedLanguage(normalizedValue) ? normalizedValue : null;
};

export const normalizeLanguage = (value: string | null | undefined): SupportedLanguage => {
  return parseSupportedLanguage(value) ?? defaultLanguage;
};
