import type { ReactNode } from "react";

type AdminShellProps = {
  children: ReactNode;
};

export const AdminShell = ({ children }: AdminShellProps) => (
  <div data-admin-shell="root" data-admin-contour="admin-web">
    {children}
  </div>
);
