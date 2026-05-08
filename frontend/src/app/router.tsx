import type { ReactElement } from "react";
import { AppShell } from "./app-shell";
import { LocalizationBoundary } from "./localization-boundary";
import { createTelegramLanguagePersistence } from "../shared/lib/language-persistence";
import { isStorefrontPathname, routes } from "../shared/lib/routes";
import { createLanguageController, type LanguageController } from "../shared/state/language";
import type { UiShellState } from "../shared/state/ui-shell";
import { createTelegramWebAppBridge } from "../shared/telegram/webapp";
import type { TelegramWebAppBridge } from "../shared/telegram/webapp";
import { CatalogRoute } from "../slices/catalog/routes/catalog-route";
import { CheckoutPaymentRoute } from "../slices/checkout-payment/routes/checkout-payment-route";
import { OrderTrackingRoute } from "../slices/order-tracking/routes/order-tracking-route";

export type AppRoute = {
  path: string;
  element: ReactElement;
  matches?: (pathname: string) => boolean;
};

export const appRoutes: AppRoute[] = [
  {
    path: routes.catalog,
    element: <CatalogRoute />,
  },
  {
    path: routes.catalogBrowse,
    element: <CatalogRoute />,
  },
  {
    path: routes.storefront,
    element: <CatalogRoute />,
    matches: isStorefrontPathname,
  },
  {
    path: routes.checkoutPayment,
    element: <CheckoutPaymentRoute />,
  },
  {
    path: routes.orderTracking,
    element: <OrderTrackingRoute />,
  },
];

export const resolveAppRoute = (pathname: string): AppRoute =>
  appRoutes.find((route) => route.matches?.(pathname) ?? route.path === pathname) ?? appRoutes[0];

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return routes.catalog;
  }

  return window.location.pathname;
};

type AppRouterProps = {
  languageController?: LanguageController;
  shellState?: UiShellState;
  telegramBridge?: TelegramWebAppBridge;
};

const createDefaultLanguageController = (): LanguageController =>
  createLanguageController(createTelegramLanguagePersistence(createTelegramWebAppBridge()));

export const AppRouter = ({
  languageController = createDefaultLanguageController(),
  shellState,
  telegramBridge,
}: AppRouterProps = {}) => (
  <AppShell state={shellState} telegramBridge={telegramBridge}>
    <LocalizationBoundary controller={languageController}>{resolveAppRoute(getCurrentPathname()).element}</LocalizationBoundary>
  </AppShell>
);
