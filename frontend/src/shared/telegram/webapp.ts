export type TelegramWebAppBridge = {
  ready: () => void;
  expand: () => void;
};

export const createTelegramWebAppBridge = (): TelegramWebAppBridge => ({
  ready: () => undefined,
  expand: () => undefined,
});
