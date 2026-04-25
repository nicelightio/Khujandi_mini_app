import type { CSSProperties } from "react";

import type { StorefrontVisualTuning } from "./storefront-view";

export const defaultStorefrontVisualTuning: StorefrontVisualTuning = {
  heroDim: 60,
  heroGlow: 42,
  patternOpacity: 32,
  glassBlur: 16,
  cardLift: 26,
};

export const createStorefrontVisualStyle = (tuning: StorefrontVisualTuning): CSSProperties => ({
  "--storefront-hero-dim": `${tuning.heroDim / 100}`,
  "--storefront-hero-glow": `${tuning.heroGlow / 100}`,
  "--storefront-pattern-opacity": `${tuning.patternOpacity / 100}`,
  "--storefront-glass-blur": `${tuning.glassBlur}px`,
  "--storefront-card-lift": `${tuning.cardLift}px`,
} as CSSProperties);

export const StorefrontEffectsDock = ({
  tuning,
  isOpen,
  logs = [],
  showDebug,
  onToggle,
  onChange,
}: {
  tuning: StorefrontVisualTuning;
  isOpen: boolean;
  logs?: string[];
  showDebug: boolean;
  onToggle: () => void;
  onChange: (name: keyof StorefrontVisualTuning, value: number) => void;
}) => {
  const joinedLogs = logs.join("\n");

  return (
    <>
      <div
        data-storefront-fx="dock"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button type="button" data-storefront-fx="toggle" data-magnetic="true" onClick={onToggle}>
          {isOpen ? "Hide effects" : "Show effects"}
        </button>
        {isOpen ? (
          <section data-storefront-fx="panel">
            <h3>Visual controls</h3>
            <label data-storefront-fx="control">
              <span>Hero dim</span>
              <strong>{tuning.heroDim}</strong>
              <input
                type="range"
                min="20"
                max="90"
                value={tuning.heroDim}
                onChange={(event) => {
                  onChange("heroDim", Number(event.target.value));
                }}
              />
            </label>
            <label data-storefront-fx="control">
              <span>Glow</span>
              <strong>{tuning.heroGlow}</strong>
              <input
                type="range"
                min="0"
                max="100"
                value={tuning.heroGlow}
                onChange={(event) => {
                  onChange("heroGlow", Number(event.target.value));
                }}
              />
            </label>
            <label data-storefront-fx="control">
              <span>Pattern</span>
              <strong>{tuning.patternOpacity}</strong>
              <input
                type="range"
                min="0"
                max="70"
                value={tuning.patternOpacity}
                onChange={(event) => {
                  onChange("patternOpacity", Number(event.target.value));
                }}
              />
            </label>
            <label data-storefront-fx="control">
              <span>Glass blur</span>
              <strong>{tuning.glassBlur}</strong>
              <input
                type="range"
                min="0"
                max="26"
                value={tuning.glassBlur}
                onChange={(event) => {
                  onChange("glassBlur", Number(event.target.value));
                }}
              />
            </label>
            <label data-storefront-fx="control">
              <span>Card lift</span>
              <strong>{tuning.cardLift}</strong>
              <input
                type="range"
                min="0"
                max="44"
                value={tuning.cardLift}
                onChange={(event) => {
                  onChange("cardLift", Number(event.target.value));
                }}
              />
            </label>
          </section>
        ) : null}
      </div>

      {showDebug ? (
        <section data-storefront-debug="panel">
          <div data-storefront-debug="header">
            <div>
              <p data-storefront-section-label>Debug logs</p>
              <h3>Storefront diagnostics</h3>
            </div>
            <button
              type="button"
              data-magnetic="true"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
                  void navigator.clipboard.writeText(joinedLogs);
                }
              }}
            >
              Copy logs
            </button>
          </div>
          <textarea readOnly value={joinedLogs} data-storefront-debug="output" />
        </section>
      ) : null}
    </>
  );
};
