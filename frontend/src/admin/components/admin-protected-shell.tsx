import type { ReactNode } from "react";
import type { AdminSessionState } from "../model/admin-access-shell";
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
        <p>{session.actorLabel}</p>
        <p>{session.idleTimeoutLabel}</p>
        <button
          type="button"
          data-admin-auth="logout"
          disabled={isLogoutSubmitting}
          onClick={() => {
            if (onLogout !== undefined) {
              void onLogout();
            }
          }}
        >
          {isLogoutSubmitting ? "Signing out..." : "Sign out"}
        </button>
        {children}
      </div>
    </AdminShell>
  );
};
