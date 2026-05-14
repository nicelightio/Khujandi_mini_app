import { useEffect, useRef, useState, type ReactElement } from "react";
import { createAdminAuthApi, AdminAuthApiError, type AdminAuthApi } from "../api/admin-auth-api";
import {
  createAnonymousAdminSessionState,
  createAuthenticatedAdminSessionState,
  createExpiredAdminSessionState,
  createRestoringAdminSessionState,
  type AdminSessionState,
} from "../model/admin-access-shell";
import { AdminLoginPage } from "../components/admin-login-page";
import { AdminDashboardPage } from "../components/admin-dashboard-page";
import { AdminForbiddenRoute } from "../components/admin-forbidden-route";
import { AdminProtectedShell } from "../components/admin-protected-shell";
import { AdminShell } from "../components/admin-shell";
import { AdminUnknownRoute } from "../components/admin-unknown-route";
import { adminRoutes as adminRoutePaths } from "../lib/routes";
import { AdminAssignmentRoute } from "../routes/admin-assignment-route";
import { AdminCatalogProvisioningRoute } from "../routes/admin-catalog-provisioning-route";
import { AdminOrderCancellationRoute } from "../routes/admin-order-cancellation-route";
import { AdminStaffRoute } from "../routes/admin-staff-route";

type AdminRouteRole = Extract<AdminSessionState, { status: "authenticated" }>["role"];

export type AdminRoute = {
  path: string;
  element: ReactElement;
  requiresAuth: boolean;
  allowedRoles?: readonly AdminRouteRole[];
};

export const adminRoutes: AdminRoute[] = [
  {
    path: adminRoutePaths.home,
    element: <AdminDashboardPage />,
    requiresAuth: true,
  },
  {
    path: adminRoutePaths.login,
    element: <AdminLoginPage session={createAnonymousAdminSessionState()} redirectPath={adminRoutePaths.home} />,
    requiresAuth: false,
  },
  {
    path: adminRoutePaths.catalogProvisioning,
    element: <AdminCatalogProvisioningRoute />,
    requiresAuth: true,
  },
  {
    path: adminRoutePaths.assignment,
    element: <AdminAssignmentRoute />,
    requiresAuth: true,
  },
  {
    path: adminRoutePaths.cancellation,
    element: <AdminOrderCancellationRoute />,
    requiresAuth: true,
  },
  {
    path: adminRoutePaths.staff,
    element: <AdminStaffRoute role="admin" />,
    requiresAuth: true,
    allowedRoles: ["admin", "boss"],
  },
];

const normalizeAdminPathname = (pathname: string): string => {
  const [pathOnly = adminRoutePaths.home] = pathname.split(/[?#]/u);

  if (pathOnly === adminRoutePaths.home) {
    return pathOnly;
  }

  return pathOnly.endsWith("/") ? pathOnly.slice(0, -1) : pathOnly;
};

export const resolveAdminRoute = (pathname: string): AdminRoute | null =>
  adminRoutes.find((route) => route.path === normalizeAdminPathname(pathname)) ?? null;

export const resolveAdminOrderCancellationOrderId = (search: string): string | null => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const orderId = params.get("orderId") ?? params.get("order_id");
  const trimmed = orderId?.trim() ?? "";

  return trimmed.length === 0 ? null : trimmed;
};

const resolveSearchInput = (pathname: string, search = ""): string => {
  if (search.trim().length > 0) {
    return search;
  }

  const queryStart = pathname.indexOf("?");

  if (queryStart === -1) {
    return "";
  }

  const hashStart = pathname.indexOf("#", queryStart);

  return pathname.slice(queryStart, hashStart === -1 ? undefined : hashStart);
};

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return adminRoutePaths.home;
  }

  return window.location.pathname;
};

const getCurrentSearch = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return typeof window.location.search === "string" ? window.location.search : "";
};

type AdminRouterProps = {
  pathname?: string;
  search?: string;
  session?: AdminSessionState;
  authApi?: AdminAuthApi;
};

export const AdminRouter = ({
  pathname = getCurrentPathname(),
  search = getCurrentSearch(),
  session: sessionProp,
  authApi,
}: AdminRouterProps) => {
  const authApiRef = useRef(authApi ?? createAdminAuthApi());
  const refreshAttemptedPathRef = useRef<string | null>(null);
  const refreshRequestIdRef = useRef(0);
  const [activePath, setActivePath] = useState(() => pathname);
  const [activeSearch, setActiveSearch] = useState(() => search);
  const [activeSession, setActiveSession] = useState<AdminSessionState>(() =>
    sessionProp ?? createAnonymousAdminSessionState(),
  );
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isLogoutSubmitting, setIsLogoutSubmitting] = useState(false);

  useEffect(() => {
    authApiRef.current = authApi ?? createAdminAuthApi();
  }, [authApi]);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  useEffect(() => {
    setActiveSearch(search);
  }, [search]);

  useEffect(() => {
    if (sessionProp !== undefined) {
      setActiveSession(sessionProp);
    }
  }, [sessionProp]);

  useEffect(() => {
    if (activePath === adminRoutePaths.login && activeSession.status === "authenticated") {
      setActivePath(adminRoutePaths.home);
    }
  }, [activePath, activeSession.status]);

  const route = resolveAdminRoute(activePath);

  useEffect(() => {
    const shouldRestoreSession =
      route !== null && (route.requiresAuth || route.path === adminRoutePaths.login);

    if (!shouldRestoreSession) {
      refreshAttemptedPathRef.current = null;
      refreshRequestIdRef.current += 1;
      return;
    }

    if (
      activeSession.status === "authenticated" ||
      activeSession.status === "restoring" ||
      activeSession.status === "expired"
    ) {
      return;
    }

    if (refreshAttemptedPathRef.current === activePath) {
      return;
    }

    refreshAttemptedPathRef.current = activePath;
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;
    setActiveSession(createRestoringAdminSessionState());

    void authApiRef.current
      .refresh()
      .then((nextSession) => {
        if (refreshRequestIdRef.current !== requestId) {
          return;
        }

        setActiveSession(
          createAuthenticatedAdminSessionState({
            adminAccountId: nextSession.adminAccountId,
            role: nextSession.role,
            idleExpiresAt: nextSession.idleExpiresAt,
          }),
        );
      })
      .catch((error) => {
        if (refreshRequestIdRef.current !== requestId) {
          return;
        }

        if (error instanceof AdminAuthApiError && error.code === "SESSION_EXPIRED") {
          setActiveSession(createExpiredAdminSessionState());
          return;
        }

        setActiveSession(createAnonymousAdminSessionState());
      });
  }, [activePath, activeSession.status, route]);

  const handleLogin = async (input: { login: string; password: string }) => {
    setIsLoginSubmitting(true);

    try {
      const nextSession = await authApiRef.current.login(input);

      refreshRequestIdRef.current += 1;
      refreshAttemptedPathRef.current = null;
      setActiveSession(
        createAuthenticatedAdminSessionState({
          adminAccountId: nextSession.adminAccountId,
          role: nextSession.role,
          idleExpiresAt: nextSession.idleExpiresAt,
        }),
      );
      setActivePath(route?.requiresAuth ? activePath : adminRoutePaths.home);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutSubmitting(true);

    try {
      await authApiRef.current.logout();
      refreshRequestIdRef.current += 1;
      refreshAttemptedPathRef.current = adminRoutePaths.login;
      setActiveSession({
        ...createAnonymousAdminSessionState(),
        reason: "Вы вышли из админ-сессии.",
      });
      setActivePath(adminRoutePaths.login);
    } finally {
      setIsLogoutSubmitting(false);
    }
  };

  if (route === null) {
    return (
      <AdminShell>
        <AdminUnknownRoute />
      </AdminShell>
    );
  }

  const isForbiddenRoute =
    activeSession.status === "authenticated" &&
    route.allowedRoles !== undefined &&
    !route.allowedRoles.includes(activeSession.role);

  const routeElement = isForbiddenRoute ? (
    <AdminForbiddenRoute
      title="Staff panel недоступен"
      message="Staff panel доступен только ролям admin и boss. Operator-сессия не может открыть этот раздел."
    />
  ) : route.path === adminRoutePaths.home ? (
    <AdminDashboardPage role={activeSession.status === "authenticated" ? activeSession.role : undefined} />
  ) : route.path === adminRoutePaths.staff ? (
    <AdminStaffRoute
      role={activeSession.status === "authenticated" && activeSession.role === "boss" ? "boss" : "admin"}
    />
  ) : route.path === adminRoutePaths.cancellation ? (
    <AdminOrderCancellationRoute
      orderId={resolveAdminOrderCancellationOrderId(resolveSearchInput(activePath, activeSearch))}
    />
  ) : (
    route.element
  );

  if (!route.requiresAuth) {
    return (
      <AdminShell>
        <AdminLoginPage
          session={
            activeSession.status === "authenticated" ? createAnonymousAdminSessionState() : activeSession
          }
          redirectPath={adminRoutePaths.home}
          isSubmitting={isLoginSubmitting}
          onLogin={handleLogin}
        />
      </AdminShell>
    );
  }

  return (
    <AdminProtectedShell
      session={activeSession}
      pathname={activePath}
      isLoginSubmitting={isLoginSubmitting}
      isLogoutSubmitting={isLogoutSubmitting}
      onLogin={handleLogin}
      onLogout={handleLogout}
    >
      {routeElement}
    </AdminProtectedShell>
  );
};
