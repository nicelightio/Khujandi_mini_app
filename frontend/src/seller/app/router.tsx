import type { ReactElement } from "react";
import { SellerShell } from "../components/seller-shell";
import { sellerRoutes as sellerRoutePaths } from "../lib/routes";
import { SellerShopStatusRoute } from "../routes/seller-shop-status-route";

export type SellerRoute = {
  path: string;
  element: ReactElement;
};

export const sellerRoutes: SellerRoute[] = [
  {
    path: sellerRoutePaths.shopStatus,
    element: <SellerShopStatusRoute />,
  },
];

const SellerUnknownRoute = () => (
  <section>
    <h1>Seller page not found</h1>
    <p>Unknown seller-web path. Use the explicit store-admin routes only.</p>
  </section>
);

export const resolveSellerRoute = (pathname: string): SellerRoute | null =>
  sellerRoutes.find((route) => route.path === pathname) ?? null;

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return sellerRoutePaths.shopStatus;
  }

  return window.location.pathname;
};

type SellerRouterProps = {
  pathname?: string;
};

export const SellerRouter = ({ pathname = getCurrentPathname() }: SellerRouterProps) => {
  const route = resolveSellerRoute(pathname);

  return <SellerShell>{route?.element ?? <SellerUnknownRoute />}</SellerShell>;
};
