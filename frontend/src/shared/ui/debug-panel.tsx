import { isDebugEnabled } from "../config/debug";
import { useOptionalUiShell } from "../state/ui-shell-context";

type DebugPanelProps = {
  extraLines?: string[];
};

const getCurrentPath = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
};

export const DebugPanel = ({ extraLines = [] }: DebugPanelProps) => {
  const shell = useOptionalUiShell();

  if (!isDebugEnabled) {
    return null;
  }

  const lines = [
    `Path: ${getCurrentPath()}`,
    `Telegram runtime: ${shell?.state.isTelegramEnvironment === true ? "available" : "unavailable"}`,
    `Shell ready: ${shell?.state.isReady === true ? "true" : "false"}`,
    `Theme: ${shell?.state.theme ?? "unknown"}`,
    `Viewport stable height: ${shell?.state.viewport.stableHeight ?? "none"}`,
    `Bottom action layout: ${shell?.state.capabilities.bottomActionLayout ?? "inline"}`,
    ...extraLines,
  ];

  return (
    <section data-debug-panel="enabled">
      <p>DEBUG MODE</p>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <label htmlFor="debug-keyboard-test-input">Keyboard test field</label>
      <input
        id="debug-keyboard-test-input"
        name="debugKeyboardTest"
        type="text"
        placeholder="Tap here to test the keyboard"
        autoComplete="off"
      />
    </section>
  );
};
