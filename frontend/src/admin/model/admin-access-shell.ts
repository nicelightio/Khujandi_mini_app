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
      role: "boss" | "operator" | "admin";
      actorLabel: string;
      idleTimeoutLabel: string;
    };

export type AnonymousAdminSessionState = Extract<AdminSessionState, { status: "anonymous" }>;
export type ExpiredAdminSessionState = Extract<AdminSessionState, { status: "expired" }>;
export type RestoringAdminSessionState = Extract<AdminSessionState, { status: "restoring" }>;
export type AuthenticatedAdminSessionState = Extract<AdminSessionState, { status: "authenticated" }>;

export const createAnonymousAdminSessionState = (): AnonymousAdminSessionState => ({
  status: "anonymous",
  loginHint: "Используйте заранее созданную админ-учетку. Авторизация админки отделена от авторизации Telegram Mini App.",
  reason: null,
});

export const createExpiredAdminSessionState = (): ExpiredAdminSessionState => ({
  status: "expired",
  loginHint: "Войдите под заранее созданной админ-учеткой, чтобы восстановить доступ к защищенным разделам.",
  reason: "Админ-сессия истекла или недоступна. Войдите заново.",
});

export const createRestoringAdminSessionState = (): RestoringAdminSessionState => ({
  status: "restoring",
  loginHint: "Перед открытием защищенных разделов сессия восстанавливается через cookie-based auth boundary.",
  reason: "Проверяем существующую админ-сессию...",
});

type CreateAuthenticatedAdminSessionStateInput = {
  adminAccountId?: string;
  role?: "boss" | "operator" | "admin";
  idleExpiresAt?: string;
};

export const createAuthenticatedAdminSessionState = (
  input: CreateAuthenticatedAdminSessionStateInput = {},
): AuthenticatedAdminSessionState => ({
  status: "authenticated",
  adminAccountId: input.adminAccountId ?? "admin-account-demo",
  role: input.role ?? "admin",
  actorLabel: `Вход: ${input.role ?? "admin"} (${input.adminAccountId ?? "admin-account-demo"}).`,
  idleTimeoutLabel:
    input.idleExpiresAt === undefined
      ? "Время простоя контролируется серверной cookie-сессией."
      : `Время простоя контролируется серверной границей до ${input.idleExpiresAt}.`,
});
