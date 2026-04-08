import { AdminRouter } from "../admin/app/router";
import { AppRouter } from "./router";

export const isAdminPathname = (pathname: string): boolean => pathname.startsWith("/admin");

export const RootRouter = () => (isAdminPathname(window.location.pathname) ? <AdminRouter /> : <AppRouter />);
