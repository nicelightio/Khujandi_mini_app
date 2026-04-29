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
import { AdminProtectedShell } from "../components/admin-protected-shell";
import { AdminShell } from "../components/admin-shell";
import { AdminUnknownRoute } from "../components/admin-unknown-route";
import { adminRoutes as adminRoutePaths } from "../lib/routes";
import { AdminAssignmentRoute } from "../routes/admin-assignment-route";
import { AdminCatalogProvisioningRoute } from "../routes/admin-catalog-provisioning-route";
import { AdminOrderCancellationRoute } from "../routes/admin-order-cancellation-route";

export type AdminRoute = {
  path: string;
  element: ReactElement;
  requiresAuth: boolean;
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
];

export const resolveAdminRoute = (pathname: string): AdminRoute | null =>
  adminRoutes.find((route) => route.path === pathname) ?? null;

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return adminRoutePaths.home;
  }

  return window.location.pathname;
};

type AdminRouterProps = {
  pathname?: string;
  session?: AdminSessionState;
  authApi?: AdminAuthApi;
};

export const AdminRouter = ({
  pathname = getCurrentPathname(),
  session: sessionProp,
  authApi,
}: AdminRouterProps) => {
  const authApiRef = useRef(authApi ?? createAdminAuthApi());
  const refreshAttemptedPathRef = useRef<string | null>(null);
  const refreshRequestIdRef = useRef(0);
  const [activePath, setActivePath] = useState(() => pathname);
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
    if (route === null || route.requiresAuth === false) {
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
      refreshAttemptedPathRef.current = null;
      setActiveSession({
        ...createAnonymousAdminSessionState(),
        reason: "You signed out of the admin session.",
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
      {route.element}
    </AdminProtectedShell>
  );
};
