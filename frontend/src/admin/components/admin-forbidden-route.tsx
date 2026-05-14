import { AdminPageShell } from "./admin-page-shell";

type AdminForbiddenRouteProps = {
  title?: string;
  message?: string;
};

export const AdminForbiddenRoute = ({
  title = "Доступ запрещен",
  message = "Этот раздел admin-web недоступен для текущей роли.",
}: AdminForbiddenRouteProps) => (
  <AdminPageShell title={title}>
    <section data-admin-panel="context">
      <span data-admin-ui="micro-label">RBAC</span>
      <p>{message}</p>
    </section>
  </AdminPageShell>
);
