import { useEffect } from "react";
import { AdminRouter } from "../admin/app/router";
import { SellerRouter } from "../seller/app/router";
import { isRouteFamilyPathname } from "../shared/lib/routes";
import { AppRouter } from "./router";

export const isAdminPathname = (pathname: string): boolean => isRouteFamilyPathname(pathname, "/admin");
export const isSellerPathname = (pathname: string): boolean => isRouteFamilyPathname(pathname, "/seller");

const resolveRootContour = (pathname: string): "admin-web" | "seller-web" | "mini-app" => {
  if (isAdminPathname(pathname)) {
    return "admin-web";
  }

  if (isSellerPathname(pathname)) {
    return "seller-web";
  }

  return "mini-app";
};

export const RootRouter = () => {
  const pathname = window.location.pathname;
  const contour = resolveRootContour(pathname);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.dataset.rootContour = contour;

    return () => {
      delete document.body.dataset.rootContour;
    };
  }, [contour]);

  if (contour === "admin-web") {
    return <AdminRouter />;
  }

  if (contour === "seller-web") {
    return <SellerRouter />;
  }

  return <AppRouter />;
};
