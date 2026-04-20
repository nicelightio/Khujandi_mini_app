import type { ReactNode } from "react";
import { DebugPanel } from "../../shared/ui/debug-panel";

type SellerPageShellProps = {
  title: string;
  children: ReactNode;
};

export const SellerPageShell = ({ title, children }: SellerPageShellProps) => (
  <main data-seller-page="shell">
    <header>
      <p data-seller-page="contour-label">Seller Web</p>
      <h1>{title}</h1>
    </header>
    <div data-seller-page="body">{children}</div>
    <DebugPanel />
  </main>
);
