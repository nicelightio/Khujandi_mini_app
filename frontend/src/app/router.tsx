import type { ReactElement } from "react";
import { routes } from "../shared/lib/routes";
import { CatalogRoute } from "../slices/catalog/routes/catalog-route";

export type AppRoute = {
  path: string;
  element: ReactElement;
};

export const appRoutes: AppRoute[] = [
  {
    path: routes.catalog,
    element: <CatalogRoute />,
  },
];

export const AppRouter = () => appRoutes[0].element;
