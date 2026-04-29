import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RootRouter } from "./root-router";
import { StartupSplashGate } from "./startup-splash";
import "../shared/styles/webview-shell.css";
import "../admin/styles/admin-theme.css";
import "../slices/catalog/styles/catalog-storefront.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element '#root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <StartupSplashGate>
      <RootRouter />
    </StartupSplashGate>
  </StrictMode>,
);
