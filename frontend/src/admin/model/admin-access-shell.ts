export type AdminSessionState =
  | {
      status: "anonymous";
      loginHint: string;
      reason: string | null;
    }
  | {
      status: "expired";
      loginHint: string;
      reason: string;
    }
  | {
      status: "restoring";
      loginHint: string;
      reason: string;
    }
  | {
      status: "authenticated";
      adminAccountId: string;
      role: "boss" | "manager" | "admin";
      actorLabel: string;
      idleTimeoutLabel: string;
    };

export type AnonymousAdminSessionState = Extract<AdminSessionState, { status: "anonymous" }>;
export type ExpiredAdminSessionState = Extract<AdminSessionState, { status: "expired" }>;
export type RestoringAdminSessionState = Extract<AdminSessionState, { status: "restoring" }>;
export type AuthenticatedAdminSessionState = Extract<AdminSessionState, { status: "authenticated" }>;

export const createAnonymousAdminSessionState = (): AnonymousAdminSessionState => ({
  status: "anonymous",
  loginHint: "Use a provisioned admin account. Admin auth stays isolated from Telegram Mini App auth.",
  reason: null,
});

export const createExpiredAdminSessionState = (): ExpiredAdminSessionState => ({
  status: "expired",
  loginHint: "Use a provisioned admin account to restore access to protected admin routes.",
  reason: "Your admin session expired or became unavailable. Sign in again.",
});

export const createRestoringAdminSessionState = (): RestoringAdminSessionState => ({
  status: "restoring",
  loginHint: "Admin session restore uses the cookie-based auth boundary before protected routes render.",
  reason: "Checking for an existing admin session...",
});

type CreateAuthenticatedAdminSessionStateInput = {
  adminAccountId?: string;
  role?: "boss" | "manager" | "admin";
  idleExpiresAt?: string;
};

export const createAuthenticatedAdminSessionState = (
  input: CreateAuthenticatedAdminSessionStateInput = {},
): AuthenticatedAdminSessionState => ({
  status: "authenticated",
  adminAccountId: input.adminAccountId ?? "admin-account-demo",
  role: input.role ?? "admin",
  actorLabel: `Signed in as ${input.role ?? "admin"} (${input.adminAccountId ?? "admin-account-demo"}).`,
  idleTimeoutLabel:
    input.idleExpiresAt === undefined
      ? "Idle timeout stays enforced on the server-side cookie session boundary."
      : `Idle timeout is enforced on the server-side boundary until ${input.idleExpiresAt}.`,
});
