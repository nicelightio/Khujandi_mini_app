import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  createTelegramWebAppBridge,
  type TelegramSwipeBehavior,
  type TelegramWebAppBridge,
} from "../telegram/webapp";
import { type UiShellState } from "./ui-shell";

export type UiShellPagePolicy = {
  backHref: string | null;
  backLabel: string | null;
  swipeBehavior: TelegramSwipeBehavior;
  actionLabel: string | null;
  isActionPending: boolean;
  isActionDisabled: boolean;
};

export type UiShellPagePolicyInput = Partial<UiShellPagePolicy>;

const createUiShellPagePolicy = (
  value: UiShellPagePolicyInput = {},
): UiShellPagePolicy => ({
  backHref: value.backHref ?? null,
  backLabel: value.backLabel ?? null,
  swipeBehavior: value.swipeBehavior ?? "default",
  actionLabel: value.actionLabel ?? null,
  isActionPending: value.isActionPending ?? false,
  isActionDisabled: value.isActionDisabled ?? false,
});

const isSamePagePolicy = (left: UiShellPagePolicy, right: UiShellPagePolicy): boolean => {
  return (
    left.backHref === right.backHref &&
    left.backLabel === right.backLabel &&
    left.swipeBehavior === right.swipeBehavior &&
    left.actionLabel === right.actionLabel &&
    left.isActionPending === right.isActionPending &&
    left.isActionDisabled === right.isActionDisabled
  );
};

type UiShellContextValue = {
  state: UiShellState;
  telegramBridge: TelegramWebAppBridge;
  pagePolicy: UiShellPagePolicy;
  setPagePolicy: (policy: UiShellPagePolicyInput) => void;
};

const UiShellContext = createContext<UiShellContextValue | null>(null);

type UiShellProviderProps = {
  children: ReactNode;
  state: UiShellState;
  telegramBridge?: TelegramWebAppBridge;
};

export const UiShellProvider = ({
  children,
  state,
  telegramBridge = createTelegramWebAppBridge(),
}: UiShellProviderProps) => {
  const [pagePolicy, setPagePolicyState] = useState<UiShellPagePolicy>(createUiShellPagePolicy());

  const setPagePolicy = useCallback((policy: UiShellPagePolicyInput) => {
    const nextPolicy = createUiShellPagePolicy(policy);

    setPagePolicyState((currentPolicy) => {
      return isSamePagePolicy(currentPolicy, nextPolicy) ? currentPolicy : nextPolicy;
    });
  }, []);

  const value = useMemo<UiShellContextValue>(
    () => ({
      state,
      telegramBridge,
      pagePolicy,
      setPagePolicy,
    }),
    [pagePolicy, setPagePolicy, state, telegramBridge],
  );

  return <UiShellContext.Provider value={value}>{children}</UiShellContext.Provider>;
};

export const useUiShell = (): UiShellContextValue => {
  const value = useContext(UiShellContext);

  if (value === null) {
    throw new Error("UI shell context is unavailable outside AppShell.");
  }

  return value;
};

export const useOptionalUiShell = (): UiShellContextValue | null => {
  return useContext(UiShellContext);
};
