---
description: Handoff notes for TASK-FT003-01.
status: active
---
# TASK-FT003-01 Handoff

## Completed
- Docs-first boundary for `FT-003` is frozen across feature, runtime contract, verification runbook, backlog, and changelog.

## Ready follow-ups
- `TASK-FT003-02`: scaffold shared i18n state, persistence helpers, and overlay entrypoints.

## Guardrails for next task
- Reuse the Telegram runtime adapter boundary from `mini-app-runtime-contract`; do not allow direct component access to `Telegram.WebApp.*` or `localStorage`.
- Preserve `DeviceStorage -> CloudStorage -> localStorage` as the explicit pre-auth fallback order for non-sensitive preferences.
- Keep `FT-003` scoped to language overlay/persistence/sync; do not pull safe-area, theme, viewport, or lifecycle shell work from `FT-009` into localization scaffolding.
