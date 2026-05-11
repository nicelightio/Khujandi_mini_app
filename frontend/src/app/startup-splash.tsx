import { useEffect, type ReactNode } from "react";

declare const __APP_DEBUG__: boolean;

export const startupSplashSeenStorageKey = "khujandi.startupSplash.seen";

export type StartupSplashMode = "full" | "quick";

type StartupSplashTimings = {
  dismissMs: number;
  removeMs: number;
};

const startupSplashTimings: Record<StartupSplashMode, StartupSplashTimings> = {
  full: {
    dismissMs: 3900,
    removeMs: 4400,
  },
  quick: {
    dismissMs: 1000,
    removeMs: 1250,
  },
};

export const resolveStartupSplashMode = (value: string | undefined): StartupSplashMode => (
  value === "quick" ? "quick" : "full"
);

export const getStartupSplashTimings = (mode: StartupSplashMode): StartupSplashTimings => startupSplashTimings[mode];

type StartupSplashGateProps = {
  children: ReactNode;
};

export const StartupSplashGate = ({ children }: StartupSplashGateProps) => {
  useEffect(() => {
    const initialSplash = document.getElementById("initial-splash");
    const splashMode = resolveStartupSplashMode(document.documentElement.dataset.startupSplashMode);
    const splashTimings = getStartupSplashTimings(splashMode);
    const isDebugEnabled = typeof __APP_DEBUG__ !== "undefined" && __APP_DEBUG__;

    if (isDebugEnabled) {
      console.info("[startup-splash] react-mounted", {
        initialSplashCount: document.querySelectorAll("#initial-splash").length,
        reactSplashCount: document.querySelectorAll('[data-startup-splash="root"]').length,
        splashMode,
        time: Math.round(performance.now()),
      });
    }

    if (initialSplash === null) {
      return;
    }

    const dismissTimerId = window.setTimeout(() => {
      initialSplash.classList.add("initial-splash--dismissed");

      if (isDebugEnabled) {
        console.info("[startup-splash] dismissed", {
          initialSplashCount: document.querySelectorAll("#initial-splash").length,
          splashMode,
          time: Math.round(performance.now()),
        });
      }
    }, splashTimings.dismissMs);
    const removeTimerId = window.setTimeout(() => {
      initialSplash.remove();

      if (isDebugEnabled) {
        console.info("[startup-splash] removed", {
          initialSplashCount: document.querySelectorAll("#initial-splash").length,
          splashMode,
          time: Math.round(performance.now()),
        });
      }
    }, splashTimings.removeMs);

    return () => {
      window.clearTimeout(dismissTimerId);
      window.clearTimeout(removeTimerId);
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
};

export const StartupSplash = () => (
  <div aria-hidden="true" data-startup-splash="root">
    <div data-startup-splash="orb" />
    <svg data-startup-splash="mark" viewBox="0 0 180 180" focusable="false" role="img">
      <path
        className="startup-splash-branch startup-splash-branch-1"
        d="M90 22 L42 82 H72 L34 128 H146 L108 82 H138 Z"
        pathLength={1}
      />
      <path
        className="startup-splash-branch startup-splash-branch-2"
        d="M90 48 L60 87 H78 L52 118 H128 L102 87 H120 Z"
        pathLength={1}
      />
      <path
        className="startup-splash-branch startup-splash-branch-3"
        d="M90 74 L72 99 H82 L66 120 H114 L98 99 H108 Z"
        pathLength={1}
      />
      <path className="startup-splash-branch startup-splash-branch-4" d="M82 128 H98 V154 H82 Z" pathLength={1} />
      <path
        className="startup-splash-branch startup-splash-branch-5"
        d="M90 16 L97 32 L114 34 L101 45 L105 62 L90 53 L75 62 L79 45 L66 34 L83 32 Z"
        pathLength={1}
      />
      <circle className="startup-splash-spark startup-splash-spark-1" cx="48" cy="114" r="3" />
      <circle className="startup-splash-spark startup-splash-spark-2" cx="132" cy="112" r="3" />
      <circle className="startup-splash-spark startup-splash-spark-3" cx="90" cy="92" r="2.5" />
    </svg>
    <div data-startup-splash="brand">Худжанди</div>
  </div>
);
