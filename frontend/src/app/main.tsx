import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RootRouter } from "./root-router";
import "../shared/styles/webview-shell.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element '#root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
);
