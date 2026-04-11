import type { ReactNode } from "react";

type SellerShellProps = {
  children: ReactNode;
};

export const SellerShell = ({ children }: SellerShellProps) => (
  <div data-seller-shell="root" data-seller-contour="seller-web">
    {children}
  </div>
);
