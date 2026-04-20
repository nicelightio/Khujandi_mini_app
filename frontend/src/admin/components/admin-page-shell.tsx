import type { ReactNode } from "react";
import { DebugPanel } from "../../shared/ui/debug-panel";

type AdminPageShellProps = {
  title: string;
  children: ReactNode;
};

export const AdminPageShell = ({ title, children }: AdminPageShellProps) => (
  <main data-admin-page="shell">
    <header>
      <p data-admin-page="contour-label">Admin Web</p>
      <h1>{title}</h1>
    </header>
    <div data-admin-page="body">{children}</div>
    <DebugPanel />
  </main>
);
