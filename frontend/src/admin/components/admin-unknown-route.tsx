import { AdminPageShell } from "./admin-page-shell";

export const AdminUnknownRoute = () => (
  <AdminPageShell title="Admin page not found">
    <section>
      <p>Unknown admin-web path. Use the explicit admin routes only.</p>
      <p>Return to assignment, cancellation, provisioning, or the login entrypoint.</p>
    </section>
  </AdminPageShell>
);
