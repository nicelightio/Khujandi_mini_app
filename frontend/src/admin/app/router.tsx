import type { ReactElement } from "react";
import { AdminShell } from "../components/admin-shell";
import { adminRoutes as adminRoutePaths } from "../lib/routes";
import { AdminAssignmentRoute } from "../routes/admin-assignment-route";
import { AdminOrderCancellationRoute } from "../routes/admin-order-cancellation-route";

export type AdminRoute = {
  path: string;
  element: ReactElement;
};

export const adminRoutes: AdminRoute[] = [
  {
    path: adminRoutePaths.assignment,
    element: <AdminAssignmentRoute />,
  },
  {
    path: adminRoutePaths.cancellation,
    element: <AdminOrderCancellationRoute />,
  },
];

export const resolveAdminRoute = (pathname: string): AdminRoute =>
  adminRoutes.find((route) => route.path === pathname) ?? adminRoutes[0];

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return adminRoutePaths.assignment;
  }

  return window.location.pathname;
};

export const AdminRouter = () => <AdminShell>{resolveAdminRoute(getCurrentPathname()).element}</AdminShell>;
