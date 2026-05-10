---
description: Implementation plan for TASK-FT016-06.
status: active
---
# TASK-FT016-06 Plan

## Plan

1. Inspect current admin assignment view model, page, route tests, and existing style hooks from `TASK-FT016-04/05`.
2. Add local read-model action metadata for targeted offer, guarded status control, and bot chat redirect without API calls.
3. Render the action cells in the existing operator table while preserving alert, sorting and expandable history behavior.
4. Extend focused admin route/model tests for inert action states and protected shell continuity.
5. Run focused admin tests, `npm run build:frontend`, and `git diff --check`.
6. Write final implementation report under `.tasks/TASK-FT016-06/`.

## Verification Targets

- Placeholder actions are visible but unavailable/guarded until backend phases land.
- Labels explain pending backend/runtime support.
- The UI no longer presents direct assignment as the normal flow.
- Existing admin assignment read surface, protected shell and unrelated admin routes remain intact.

## Out of Scope

- Backend command routes or mutations.
- Telegram bot deep links or external chat opening.
- Message/comment persistence.
- Cancellation/refund UI changes.
- Auto-offer setting UI.
