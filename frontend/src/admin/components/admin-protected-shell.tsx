import type { ReactNode } from "react";
import type { AdminSessionState, AuthenticatedAdminSessionState } from "../model/admin-access-shell";
import { adminRoutes } from "../lib/routes";
import { AdminLoginPage } from "./admin-login-page";
import { AdminShell } from "./admin-shell";

const isLoginSessionState = (
  session: AdminSessionState,
): session is Parameters<typeof AdminLoginPage>[0]["session"] => session.status !== "authenticated";

type AdminProtectedShellProps = {
  session: AdminSessionState;
  pathname: string;
  children: ReactNode;
  isLoginSubmitting?: boolean;
  isLogoutSubmitting?: boolean;
  onLogin?: Parameters<typeof AdminLoginPage>[0]["onLogin"];
  onLogout?: () => Promise<void>;
};

type AdminNavigationItem = {
  href: string;
  label: string;
  allowedRoles?: readonly AuthenticatedAdminSessionState["role"][];
};

export const AdminProtectedShell = ({
  session,
  pathname,
  children,
  isLoginSubmitting = false,
  isLogoutSubmitting = false,
  onLogin,
  onLogout,
}: AdminProtectedShellProps) => {
  const navigationItems: readonly AdminNavigationItem[] = [
    { href: adminRoutes.home, label: "Главная" },
    { href: adminRoutes.assignment, label: "Назначения" },
    { href: adminRoutes.cancellation, label: "Отмены" },
    { href: adminRoutes.catalogProvisioning, label: "Магазины" },
    { href: adminRoutes.staff, label: "Staff panel", allowedRoles: ["admin", "boss"] as const },
  ];

  if (isLoginSessionState(session)) {
    return (
      <AdminShell>
        <AdminLoginPage
          session={session}
          redirectPath={pathname}
          isSubmitting={isLoginSubmitting}
          onLogin={onLogin}
        />
      </AdminShell>
    );
  }

  const visibleNavigationItems = navigationItems.filter(
    (item) => item.allowedRoles === undefined || item.allowedRoles.includes(session.role),
  );

  return (
    <AdminShell>
      <div data-admin-auth="protected">
        <div data-admin-auth="frame">
          <header data-admin-auth="topbar">
            <div>
              <div data-admin-auth="brand">
                <p data-admin-auth="brand-kicker">Khujandi</p>
                <h1 data-admin-auth="brand-title">Панель управления</h1>
                <p data-admin-auth="brand-note">
                  Операционные инструменты для доставки, защищенных сессий и создания магазинов.
                </p>
              </div>
              <nav aria-label="Разделы админки" data-admin-auth="nav">
                {visibleNavigationItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    data-admin-auth="nav-link"
                    data-magnetic="true"
                    aria-current={pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
            <div data-admin-auth="session">
              <p data-admin-auth="session-chip">{session.actorLabel}</p>
              <p data-admin-auth="session-chip">{session.idleTimeoutLabel}</p>
              <button
                type="button"
                data-admin-auth="logout"
                data-magnetic="true"
                disabled={isLogoutSubmitting}
                onClick={() => {
                  if (onLogout !== undefined) {
                    void onLogout();
                  }
                }}
              >
                {isLogoutSubmitting ? "Выходим..." : "Выйти"}
              </button>
            </div>
          </header>
          {children}
        </div>
      </div>
    </AdminShell>
  );
};
