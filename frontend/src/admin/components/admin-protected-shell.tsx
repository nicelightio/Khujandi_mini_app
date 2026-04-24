import type { ReactNode } from "react";
import type { AdminSessionState } from "../model/admin-access-shell";
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

export const AdminProtectedShell = ({
  session,
  pathname,
  children,
  isLoginSubmitting = false,
  isLogoutSubmitting = false,
  onLogin,
  onLogout,
}: AdminProtectedShellProps) => {
  const navigationItems = [
    { href: adminRoutes.assignment, label: "Assignment" },
    { href: adminRoutes.cancellation, label: "Cancellation" },
    { href: adminRoutes.catalogProvisioning, label: "Provisioning" },
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

  return (
    <AdminShell>
      <div data-admin-auth="protected">
        <div data-admin-auth="frame">
          <header data-admin-auth="topbar">
            <div>
              <div data-admin-auth="brand">
                <p data-admin-auth="brand-kicker">Khujandi</p>
                <h1 data-admin-auth="brand-title">Admin Control Surface</h1>
                <p data-admin-auth="brand-note">
                  Operational tools for delivery flow, protected sessions, and catalog provisioning.
                </p>
              </div>
              <nav aria-label="Admin routes" data-admin-auth="nav">
                {navigationItems.map((item) => (
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
                {isLogoutSubmitting ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </header>
          {children}
        </div>
      </div>
    </AdminShell>
  );
};
