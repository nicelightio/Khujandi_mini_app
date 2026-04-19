export const routes = {
  catalog: "/",
  storefront: "/shops/:shopId",
  checkoutPayment: "/checkout",
  orderTracking: "/tracking",
} as const;

const storefrontPrefix = "/shops/";

export const isStorefrontPathname = (pathname: string): boolean =>
  pathname.startsWith(storefrontPrefix) &&
  pathname.length > storefrontPrefix.length &&
  !pathname.slice(storefrontPrefix.length).includes("/");

export const isRouteFamilyPathname = (pathname: string, familyPrefix: string): boolean =>
  pathname === familyPrefix || pathname.startsWith(`${familyPrefix}/`);

export const buildStorefrontPath = (shopId: string): string => `/shops/${encodeURIComponent(shopId)}`;
