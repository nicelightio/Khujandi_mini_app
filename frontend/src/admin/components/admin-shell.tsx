import type { ReactNode } from "react";
import { AdminSceneControls } from "./admin-scene-controls";

type AdminShellProps = {
  children: ReactNode;
};

export const AdminShell = ({ children }: AdminShellProps) => (
  <div data-admin-shell="root" data-admin-contour="admin-web">
    {children}
    <div data-admin-shell="controls-wrap">
      <AdminSceneControls />
    </div>
  </div>
);
