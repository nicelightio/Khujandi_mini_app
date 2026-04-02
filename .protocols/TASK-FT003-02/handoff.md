---
description: Handoff notes for TASK-FT003-02.
status: active
---
# TASK-FT003-02 Handoff

## Completed
- Shared localization scaffold for `FT-003` is in place across `shared/i18n`, `shared/lib`, `shared/state`, `shared/telegram`, and the app-level overlay boundary.
- Repo-local tests cover normalization, persistence fallback orchestration, localization overlay visibility, and runtime route rendering through the new boundary.

## Ready follow-ups
- `TASK-FT003-03`: implement deterministic language resolution and fallback policy on top of this scaffold.
- `TASK-FT003-04`: wire first-run overlay gating and authenticated language sync into customer-facing flows.

## Guardrails for next task
- Keep persistence access behind shared helpers; no direct component-level `localStorage` or `Telegram.WebApp.*` calls.
- Preserve `DeviceStorage -> CloudStorage -> localStorage` as the explicit pre-auth order.
- Treat this scaffold as technical infrastructure, not a new business slice.
- Reuse the explicit `hasPersistedLanguage` signal so an explicit `ru` selection is not mistaken for a missing preference.
