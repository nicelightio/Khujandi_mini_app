export const routes = {
  catalog: "/",
  catalogBrowse: "/shops",
  storefront: "/shops/:publicPath",
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

export const buildStorefrontPath = (publicPath: string): string => `/shops/${encodeURIComponent(publicPath)}`;

export const buildOrderTrackingPath = (orderId: string, cursor?: string): string => {
  const params = new URLSearchParams({ orderId });

  if (cursor !== undefined && cursor.length > 0) {
    params.set("cursor", cursor);
  }

  return `${routes.orderTracking}?${params.toString()}`;
};
