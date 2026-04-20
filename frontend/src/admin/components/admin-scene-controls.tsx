import { useEffect, useState } from "react";

const storageKey = "admin-scene-controls";

type SceneSettings = {
  spotAlpha: number;
  spotBlur: number;
  beamAlpha: number;
  beamSpread: number;
  mistAlpha: number;
  vignette: number;
  panelGlow: number;
  surfaceLift: number;
};

const defaultSettings: SceneSettings = {
  spotAlpha: 0.34,
  spotBlur: 20,
  beamAlpha: 0.14,
  beamSpread: 1.08,
  mistAlpha: 0.18,
  vignette: 0.3,
  panelGlow: 0.16,
  surfaceLift: 0.08,
};

const readStoredSettings = (): SceneSettings => {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (raw === null) {
      return defaultSettings;
    }

    const parsed = JSON.parse(raw) as Partial<SceneSettings>;

    return {
      spotAlpha: typeof parsed.spotAlpha === "number" ? parsed.spotAlpha : defaultSettings.spotAlpha,
      spotBlur: typeof parsed.spotBlur === "number" ? parsed.spotBlur : defaultSettings.spotBlur,
      beamAlpha: typeof parsed.beamAlpha === "number" ? parsed.beamAlpha : defaultSettings.beamAlpha,
      beamSpread: typeof parsed.beamSpread === "number" ? parsed.beamSpread : defaultSettings.beamSpread,
      mistAlpha: typeof parsed.mistAlpha === "number" ? parsed.mistAlpha : defaultSettings.mistAlpha,
      vignette: typeof parsed.vignette === "number" ? parsed.vignette : defaultSettings.vignette,
      panelGlow: typeof parsed.panelGlow === "number" ? parsed.panelGlow : defaultSettings.panelGlow,
      surfaceLift: typeof parsed.surfaceLift === "number" ? parsed.surfaceLift : defaultSettings.surfaceLift,
    };
  } catch {
    return defaultSettings;
  }
};

const formatValue = (key: keyof SceneSettings, value: number): string => {
  if (key === "spotBlur") {
    return `${Math.round(value)}px`;
  }

  return value.toFixed(2);
};

type SliderSpec = {
  key: keyof SceneSettings;
  label: string;
  min: number;
  max: number;
  step: number;
};

const sliders: SliderSpec[] = [
  { key: "spotAlpha", label: "Spot intensity", min: 0.08, max: 0.6, step: 0.01 },
  { key: "spotBlur", label: "Spot softness", min: 0, max: 40, step: 1 },
  { key: "beamAlpha", label: "Beam visibility", min: 0, max: 0.35, step: 0.01 },
  { key: "beamSpread", label: "Beam spread", min: 0.88, max: 1.24, step: 0.01 },
  { key: "mistAlpha", label: "Smoke haze", min: 0, max: 0.35, step: 0.01 },
  { key: "vignette", label: "Vignette", min: 0, max: 0.55, step: 0.01 },
  { key: "panelGlow", label: "Panel glow", min: 0, max: 0.3, step: 0.01 },
  { key: "surfaceLift", label: "Surface lift", min: 0, max: 0.18, step: 0.01 },
];

const applySettings = (settings: SceneSettings) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty("--admin-scene-spot-alpha", String(settings.spotAlpha));
  root.style.setProperty("--admin-scene-spot-blur", `${settings.spotBlur}px`);
  root.style.setProperty("--admin-scene-beam-alpha", String(settings.beamAlpha));
  root.style.setProperty("--admin-scene-beam-spread", String(settings.beamSpread));
  root.style.setProperty("--admin-scene-mist-alpha", String(settings.mistAlpha));
  root.style.setProperty("--admin-scene-vignette", String(settings.vignette));
  root.style.setProperty("--admin-scene-panel-glow", String(settings.panelGlow));
  root.style.setProperty("--admin-scene-surface-lift", String(settings.surfaceLift));
};

export const AdminSceneControls = () => {
  const [settings, setSettings] = useState<SceneSettings>(defaultSettings);

  useEffect(() => {
    const nextSettings = readStoredSettings();
    setSettings(nextSettings);
    applySettings(nextSettings);
  }, []);

  useEffect(() => {
    applySettings(settings);

    if (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      typeof window.localStorage.setItem === "function"
    ) {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
    }
  }, [settings]);

  return (
    <section data-admin-scene="controls">
      <div data-admin-scene="controls-header">
        <div>
          <p data-admin-page="contour-label">Scene Controls</p>
          <h2>Fine tune the atmosphere</h2>
        </div>
        <p data-admin-scene="controls-note">Values persist in this browser for quick visual tuning.</p>
      </div>
      <div data-admin-scene="sliders">
        {sliders.map((slider) => (
          <label key={slider.key} data-admin-scene="slider">
            <span>{slider.label}</span>
            <strong>{formatValue(slider.key, settings[slider.key])}</strong>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={settings[slider.key]}
              onChange={(event) => {
                setSettings((current) => ({
                  ...current,
                  [slider.key]: Number(event.target.value),
                }));
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
};
