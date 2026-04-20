import type { ReactNode } from "react";
import { DebugPanel } from "../../shared/ui/debug-panel";

type AdminPageShellProps = {
  title: string;
  children: ReactNode;
  layout?: "default" | "hero";
};

export const AdminPageShell = ({ title, children, layout = "default" }: AdminPageShellProps) => (
  <main data-admin-page="shell">
    <header data-admin-page="header">
      <p data-admin-page="contour-label">Admin Web</p>
      <h1>{title}</h1>
    </header>
    <div data-admin-page="body" data-admin-page-layout={layout}>
      {children}
    </div>
    <div data-admin-page="debug">
      <DebugPanel />
    </div>
  </main>
);
