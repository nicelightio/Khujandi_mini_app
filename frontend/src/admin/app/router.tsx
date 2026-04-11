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
import { AdminProtectedShell } from "../components/admin-protected-shell";
import { AdminShell } from "../components/admin-shell";
import { adminRoutes as adminRoutePaths } from "../lib/routes";
import { AdminAssignmentRoute } from "../routes/admin-assignment-route";
import { AdminCatalogProvisioningRoute } from "../routes/admin-catalog-provisioning-route";
import { AdminOrderCancellationRoute } from "../routes/admin-order-cancellation-route";

export type AdminRoute = {
  path: string;
  element: ReactElement;
  requiresAuth: boolean;
};

const AdminUnknownRoute = () => (
  <section>
    <h1>Admin page not found</h1>
    <p>Unknown admin-web path. Use the explicit admin routes only.</p>
  </section>
);

export const adminRoutes: AdminRoute[] = [
  {
    path: adminRoutePaths.login,
    element: <AdminLoginPage session={createAnonymousAdminSessionState()} redirectPath={adminRoutePaths.assignment} />,
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
    return adminRoutePaths.assignment;
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
      setActivePath(adminRoutePaths.assignment);
    }
  }, [activePath, activeSession.status]);

  const route = resolveAdminRoute(activePath);

  useEffect(() => {
    if (route === null || route.requiresAuth === false) {
      refreshAttemptedPathRef.current = null;
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

    let isActive = true;
    refreshAttemptedPathRef.current = activePath;
    setActiveSession(createRestoringAdminSessionState());

    void authApiRef.current
      .refresh()
      .then((nextSession) => {
        if (!isActive) {
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
        if (!isActive) {
          return;
        }

        if (error instanceof AdminAuthApiError && error.code === "SESSION_EXPIRED") {
          setActiveSession(createExpiredAdminSessionState());
          return;
        }

        setActiveSession(createAnonymousAdminSessionState());
      });

    return () => {
      isActive = false;
    };
  }, [activePath, activeSession.status, route]);

  const handleLogin = async (input: { login: string; password: string }) => {
    setIsLoginSubmitting(true);

    try {
      const nextSession = await authApiRef.current.login(input);

      refreshAttemptedPathRef.current = null;
      setActiveSession(
        createAuthenticatedAdminSessionState({
          adminAccountId: nextSession.adminAccountId,
          role: nextSession.role,
          idleExpiresAt: nextSession.idleExpiresAt,
        }),
      );
      setActivePath(route?.requiresAuth ? activePath : adminRoutePaths.assignment);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLogoutSubmitting(true);

    try {
      await authApiRef.current.logout();
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
          redirectPath={adminRoutePaths.assignment}
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
