export const supportedLanguages = ["ru", "en", "tj"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];
