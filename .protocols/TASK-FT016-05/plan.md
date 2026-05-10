---
description: Implementation plan for TASK-FT016-05.
status: active
---
# TASK-FT016-05 Plan

## Plan

1. Inspect current admin assignment API/model/page/styles/tests from `TASK-FT016-04`.
2. Extend local view model with deterministic severity/tone metadata, top alert rows, and sorting helpers.
3. Render alert and sort controls in the existing admin assignment page without adding mutation actions.
4. Add or update focused route/model tests for alert rendering, blinking delayed severity, deterministic color/tone mapping and sort coverage.
5. Run focused admin assignment tests, `npm run build:frontend`, and `git diff --check`.
6. Write final implementation report to `.tasks/TASK-FT016-05/TASK-FT016-05-S-IMPL-final-report-code-01.md`.

## Richer Inputs

- Found task card with `Touched files`, `Tests`, `Verify`, `Source`, and `Constraints`.
- Found implementation plan card for `TASK-FT016-05`.
- Found feature contract and operator delivery ops contract.
- Fallback not needed.

## Out Of Scope

- Backend endpoint changes unless frontend sort parsing proves impossible; current expectation is no backend change.
- Any write-side lifecycle, offer, claim, timeout, notification or chat redirect behavior.
