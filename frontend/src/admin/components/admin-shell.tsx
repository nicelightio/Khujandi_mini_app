import { useRef, type ReactNode } from "react";
import { useMagneticElements } from "../../shared/ui/use-magnetic-elements";
import { AdminSceneControls } from "./admin-scene-controls";

type AdminShellProps = {
  children: ReactNode;
};

export const AdminShell = ({ children }: AdminShellProps) => {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useMagneticElements(shellRef);

  return (
    <div ref={shellRef} data-admin-shell="root" data-admin-contour="admin-web">
      {children}
      <div data-admin-shell="controls-wrap">
        <AdminSceneControls />
      </div>
    </div>
  );
};
