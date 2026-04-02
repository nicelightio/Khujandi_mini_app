import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { createTelegramWebAppBridge, type TelegramWebAppBridge } from "../shared/telegram/webapp";
import { UiShellProvider, useUiShell } from "../shared/state/ui-shell-context";
import { createUiShellState, mergeUiShellState, type UiShellState } from "../shared/state/ui-shell";

type AppShellProps = {
  children: ReactNode;
  state?: UiShellState;
  telegramBridge?: TelegramWebAppBridge;
};

export const AppShell = ({
  children,
  state,
  telegramBridge,
}: AppShellProps) => {
  const bridge = useMemo(() => telegramBridge ?? createTelegramWebAppBridge(), [telegramBridge]);
  const [shellState, setShellState] = useState<UiShellState>(() => state ?? createUiShellState());

  useEffect(() => {
    if (state !== undefined) {
      setShellState(state);
    }
  }, [state]);

  useEffect(() => {
    const applyRuntimeSnapshot = () => {
      const snapshot = bridge.getRuntimeSnapshot();

      setShellState((currentState) => {
        const basePatch = {
          isReady: true,
          isTelegramEnvironment: snapshot.isAvailable,
        };

        if (!snapshot.isAvailable) {
          return mergeUiShellState(currentState, basePatch);
        }

        return mergeUiShellState(currentState, {
          ...basePatch,
          theme: snapshot.colorScheme,
          isExpanded: snapshot.viewport.isExpanded,
          viewport: {
            height: snapshot.viewport.height,
            stableHeight: snapshot.viewport.stableHeight,
          },
          safeArea: snapshot.safeAreaInsets,
          contentSafeArea: snapshot.contentSafeAreaInsets,
        });
      });
    };

    bridge.ready();

    if (bridge.isAvailable()) {
      bridge.expand();
    }

    applyRuntimeSnapshot();

    const unsubscribeHandlers = [
      bridge.onEvent("themeChanged", applyRuntimeSnapshot),
      bridge.onEvent("viewportChanged", applyRuntimeSnapshot),
      bridge.onEvent("safeAreaChanged", applyRuntimeSnapshot),
      bridge.onEvent("contentSafeAreaChanged", applyRuntimeSnapshot),
      bridge.onEvent("activated", () => {
        setShellState((currentState) => mergeUiShellState(currentState, { lifecycle: "active" }));
      }),
      bridge.onEvent("deactivated", () => {
        setShellState((currentState) => mergeUiShellState(currentState, { lifecycle: "inactive" }));
      }),
    ];

    return () => {
      unsubscribeHandlers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [bridge]);

  const shellStyle = useMemo<CSSProperties>(
    () => ({
      "--tg-viewport-height": shellState.viewport.height === null ? undefined : `${shellState.viewport.height}px`,
      "--tg-viewport-stable-height":
        shellState.viewport.stableHeight === null ? undefined : `${shellState.viewport.stableHeight}px`,
      "--tg-safe-area-inset-top": `${shellState.safeArea.top}px`,
      "--tg-safe-area-inset-right": `${shellState.safeArea.right}px`,
      "--tg-safe-area-inset-bottom": `${shellState.safeArea.bottom}px`,
      "--tg-safe-area-inset-left": `${shellState.safeArea.left}px`,
      "--tg-content-safe-area-inset-top": `${shellState.contentSafeArea.top}px`,
      "--tg-content-safe-area-inset-right": `${shellState.contentSafeArea.right}px`,
      "--tg-content-safe-area-inset-bottom": `${shellState.contentSafeArea.bottom}px`,
      "--tg-content-safe-area-inset-left": `${shellState.contentSafeArea.left}px`,
    } as CSSProperties),
    [shellState.contentSafeArea, shellState.safeArea, shellState.viewport.height, shellState.viewport.stableHeight],
  );

  return (
    <UiShellProvider state={shellState} telegramBridge={bridge}>
      <AppShellLayout shellStyle={shellStyle}>{children}</AppShellLayout>
    </UiShellProvider>
  );
};

type AppShellLayoutProps = {
  children: ReactNode;
  shellStyle: CSSProperties;
};

const AppShellLayout = ({ children, shellStyle }: AppShellLayoutProps) => {
  const { pagePolicy, state, telegramBridge } = useUiShell();

  useEffect(() => {
    telegramBridge.setBackButtonVisible(pagePolicy.backHref !== null);
    telegramBridge.setSwipeBehavior(pagePolicy.swipeBehavior);
  }, [pagePolicy.backHref, pagePolicy.swipeBehavior, telegramBridge]);

  const actionFeedbackState = pagePolicy.actionLabel === null
    ? "none"
    : pagePolicy.isActionPending
      ? "pending"
      : pagePolicy.isActionDisabled
        ? "disabled"
        : "idle";

  return (
    <div
      data-app-shell="root"
      data-shell-ready={state.isReady ? "true" : "false"}
      data-shell-theme={state.theme}
      data-shell-lifecycle={state.lifecycle}
      data-shell-telegram={state.isTelegramEnvironment ? "true" : "false"}
      data-shell-expanded={state.isExpanded ? "true" : "false"}
      data-shell-viewport-source={state.viewport.stableHeight === null ? "none" : "stable"}
      data-shell-back={pagePolicy.backHref === null ? "hidden" : "visible"}
      data-shell-swipe={pagePolicy.swipeBehavior}
      data-shell-action-feedback={actionFeedbackState}
      style={shellStyle}
    >
      {children}
    </div>
  );
};
