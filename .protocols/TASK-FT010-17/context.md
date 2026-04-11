# TASK-FT010-17 Context

## Task
- `TASK-FT010-17` — Remove implicit admin fallback for unknown `/admin/*` paths.

## Richer inputs loaded
- `.memory-bank/tasks/backlog.md` task card for `TASK-FT010-17`.
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`.
- `.memory-bank/requirements.md` (`REQ-025`, `REQ-026`).
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`.
- `.memory-bank/testing/index.md`.
- `.protocols/TASK-FT010-16/red-verification.md` for the opening semantic concern.

## Relevant intent
- Unknown `/admin/*` paths must not silently resolve to valid admin operational screens.
- Admin contour semantics should match the explicit unknown-path behavior already applied to `seller-web`.
- Verification should rely on focused frontend router smoke plus lint for changed files.

## Fallback note
- No richer task-local protocol templates or prior implementation bundle existed for `TASK-FT010-17`.
- Execution therefore uses the task card plus feature/testing docs as the main acceptance basis.
