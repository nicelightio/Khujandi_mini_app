---
description: План выполнения TASK-FT017-03 checkout-only debug/e2e affordance.
status: active
---
# TASK-FT017-03 Plan

## Steps

1. Add non-sensitive backend checkout bootstrap metadata exposing whether guarded mock payment is available.
2. Extend frontend checkout bootstrap/view-model with a mock-payment affordance that appears only in ready checkout state with valid composition.
3. Render a small checkout-only note/label without adding another payment button.
4. Add focused frontend tests for backend-available visibility, direct/no-composition absence and DEBUG-only/frontend-only no-trust behavior.
5. Add focused backend runtime metadata assertions because backend route metadata is touched.
6. Run focused checkout frontend tests, focused backend runtime test, `npm run build:frontend`, and `git diff --check`.
7. Write `.tasks/TASK-FT017-03/TASK-FT017-03-S-IMPL-final-report-code-01.md`.

## Non-Goals

- No payment trust changes.
- No catalog/cart UI.
- No shared UI/component abstraction.
- No failed/timeout/pending mock outcomes.
- No production mock enablement.
