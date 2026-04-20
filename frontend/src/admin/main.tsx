import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminRouter } from "./app/router";
import "../shared/styles/webview-shell.css";
import "./styles/admin-theme.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element '#root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AdminRouter />
  </StrictMode>,
);
