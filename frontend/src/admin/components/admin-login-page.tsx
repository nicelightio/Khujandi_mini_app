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
          : "Admin login is temporarily unavailable.",
      );
    }
  };

  return (
    <AdminPageShell title="Admin login" layout="hero">
      <section aria-live="polite" data-admin-login="stage">
        <p data-admin-login="eyebrow">Secure operator entry</p>
        <p data-admin-login="lede">
          Separate login/password auth for the admin contour stays isolated from Telegram Mini App auth.
        </p>
        <p>{session.loginHint}</p>
        {session.reason !== null ? <p role="status">{session.reason}</p> : null}
        {submissionError === null ? null : <p role="alert">{submissionError}</p>}
        <p>Protected routes redirect here until a valid admin-access session exists.</p>
        <p data-admin-auth="redirect-target">{`Requested path: ${redirectPath}`}</p>

        <div data-admin-login="rules">
          <div>
            <span data-admin-ui="micro-label">Boundary</span>
            <strong>Cookie-backed admin session</strong>
            <p>Runtime restores access through the shared admin-access boundary.</p>
          </div>
          <div>
            <span data-admin-ui="micro-label">Policy</span>
            <strong>No self-signup</strong>
            <p>Only provisioned admin accounts can enter the control surface.</p>
          </div>
          <div>
            <span data-admin-ui="micro-label">Recovery</span>
            <strong>Controlled expiry and lockout</strong>
            <p>Expired or unavailable sessions always return to this entrypoint.</p>
          </div>
        </div>
      </section>

      <form onSubmit={(event) => void handleSubmit(event)} data-admin-login="form">
        <fieldset>
          <legend>Provisioned account sign-in</legend>
          <label>
            Login
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
            Password
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AdminPageShell>
  );
};
