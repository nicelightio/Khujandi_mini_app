import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  children: ReactNode;
};

export const PageShell = ({ title, children }: PageShellProps) => {
  return (
    <main data-shell="page">
      <header>
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  );
};
