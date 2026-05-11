import { useState, type FormEvent } from "react";
import { AdminAuthApiError } from "../api/admin-auth-api";
import { AdminPageShell } from "./admin-page-shell";
import type { AdminSessionState } from "../model/admin-access-shell";

export type AdminLoginSessionState = Extract<
  AdminSessionState,
  { status: "anonymous" | "expired" | "restoring" }
>;

type AdminLoginPageProps = {
  session: AdminLoginSessionState;
  redirectPath: string;
  isSubmitting?: boolean;
  onLogin?: (input: { login: string; password: string }) => Promise<void>;
};

export const AdminLoginPage = ({
  session,
  redirectPath,
  isSubmitting = false,
  onLogin,
}: AdminLoginPageProps) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (onLogin === undefined || login.trim().length === 0 || password.length === 0 || isSubmitting) {
      return;
    }

    setSubmissionError(null);

    try {
      await onLogin({
        login: login.trim(),
        password,
      });
    } catch (error) {
      setSubmissionError(
        error instanceof AdminAuthApiError || error instanceof Error
          ? error.message
          : "Вход в админку временно недоступен.",
      );
    }
  };

  return (
    <AdminPageShell title="Вход в админку" layout="hero">
      <section aria-live="polite" data-admin-login="stage">
        <p data-admin-login="eyebrow">Защищенный вход для оператора</p>
        <p data-admin-login="lede">
          Отдельная авторизация по логину и паролю для админки изолирована от авторизации Telegram Mini App.
        </p>
        <p>{session.loginHint}</p>
        {session.reason !== null ? <p role="status">{session.reason}</p> : null}
        {submissionError === null ? null : <p role="alert">{submissionError}</p>}
        <p>Защищенные разделы ведут сюда, пока нет действующей admin-access сессии.</p>
        <p data-admin-auth="redirect-target">{`Запрошенный путь: ${redirectPath}`}</p>

        <div data-admin-login="rules">
          <div>
            <span data-admin-ui="micro-label">Граница</span>
            <strong>Админ-сессия на cookie</strong>
            <p>Среда выполнения восстанавливает доступ через общую границу admin-access.</p>
          </div>
          <div>
            <span data-admin-ui="micro-label">Политика</span>
            <strong>Без самостоятельной регистрации</strong>
            <p>В панель могут войти только заранее созданные админ-аккаунты.</p>
          </div>
          <div>
            <span data-admin-ui="micro-label">Восстановление</span>
            <strong>Контролируемые сроки и блокировки</strong>
            <p>Истекшие или недоступные сессии всегда возвращаются на этот вход.</p>
          </div>
        </div>
      </section>

      <form onSubmit={(event) => void handleSubmit(event)} data-admin-login="form">
        <fieldset>
          <legend>Вход под созданной учеткой</legend>
          <label>
            Логин
            <input
              name="login"
              type="text"
              autoComplete="username"
              value={login}
              onChange={(event) => {
                setLogin(event.target.value);
              }}
            />
          </label>
          <label>
            Пароль
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
          </label>
        </fieldset>
        <button
          type="submit"
          data-magnetic="true"
          disabled={isSubmitting || login.trim().length === 0 || password.length === 0}
        >
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>
    </AdminPageShell>
  );
};
