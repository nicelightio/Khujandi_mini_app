import { AdminRouter } from "../admin/app/router";
import { SellerRouter } from "../seller/app/router";
import { isRouteFamilyPathname } from "../shared/lib/routes";
import { AppRouter } from "./router";

export const isAdminPathname = (pathname: string): boolean => isRouteFamilyPathname(pathname, "/admin");
export const isSellerPathname = (pathname: string): boolean => isRouteFamilyPathname(pathname, "/seller");

export const RootRouter = () => {
  const pathname = window.location.pathname;

  if (isAdminPathname(pathname)) {
    return <AdminRouter />;
  }

  if (isSellerPathname(pathname)) {
    return <SellerRouter />;
  }

  return <AppRouter />;
};
