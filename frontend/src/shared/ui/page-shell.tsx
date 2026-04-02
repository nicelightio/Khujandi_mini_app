import { useEffect, type ReactNode } from "react";
import { useOptionalUiShell } from "../state/ui-shell-context";

type PageShellProps = {
  title: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  actionLabel?: string;
  isActionPending?: boolean;
  isActionDisabled?: boolean;
  swipeBehavior?: "default" | "locked";
};

export const PageShell = ({
  title,
  children,
  backHref,
  backLabel,
  actionLabel,
  isActionPending = false,
  isActionDisabled = false,
  swipeBehavior = "default",
}: PageShellProps) => {
  const shell = useOptionalUiShell();
  const setPagePolicy = shell?.setPagePolicy;

  useEffect(() => {
    if (setPagePolicy === undefined) {
      return;
    }

    setPagePolicy({
      backHref: backHref ?? null,
      backLabel: backLabel ?? null,
      actionLabel: actionLabel ?? null,
      isActionPending,
      isActionDisabled,
      swipeBehavior,
    });

    return () => {
      setPagePolicy({});
    };
  }, [actionLabel, backHref, backLabel, isActionDisabled, isActionPending, setPagePolicy, swipeBehavior]);

  const actionFeedbackState = actionLabel === undefined
    ? "none"
    : isActionPending
      ? "pending"
      : isActionDisabled
        ? "disabled"
        : "idle";

  return (
    <main
      data-shell="page"
      data-shell-back={backHref === undefined ? "hidden" : "visible"}
      data-shell-swipe={swipeBehavior}
      data-shell-action-feedback={actionFeedbackState}
    >
      <header data-shell-section="header">
        {backHref !== undefined && backLabel !== undefined ? (
          <a data-shell-back-link="visible" href={backHref}>
            {backLabel}
          </a>
        ) : null}
        <h1>{title}</h1>
      </header>
      {actionLabel !== undefined ? (
        <p data-shell-action-feedback={actionFeedbackState}>{actionLabel}</p>
      ) : null}
      <div data-shell-section="body">{children}</div>
    </main>
  );
};
