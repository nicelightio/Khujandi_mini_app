---
description: Execution plan for TASK-FT003-04.
status: active
---
# TASK-FT003-04 Plan

## Goal
- Make first-run language selection a real gate for customer-facing UI and synchronize the explicit language choice into the authenticated backend profile once Telegram auth succeeds.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-003`
- `IMPL-FT-003`
- `mini-app-runtime-contract`
- `requirements.md`
- `EP-001`
- `testing/index.md`
- `frontend-presentation-and-webview`
- `frontend-slices-and-webview`
- `storage-and-state-implementation`

## Planned changes
1. Add a small app-level language context on top of the existing localization boundary so routes can read the current explicit language without bypassing shared state.
2. Tighten the localization boundary so it blocks customer-facing route rendering until the mandatory language choice is satisfied.
3. Extend the checkout frontend flow with a backend-facing language sync call immediately after successful Telegram auth.
4. Add a narrow backend language update path in the owning `checkout-payment` slice with supported-language validation.
5. Add focused frontend and backend tests for overlay gating and post-auth explicit language persistence, then sync protocols and Memory Bank.

## Verification targets
- Clean first-run flow does not render customer-facing route content before language selection.
- Successful checkout auth triggers backend language sync with the current explicit language.
- Backend updates canonical user language to the explicit choice and rejects unsupported values.

## Quality gates
- Focused Jest suites for `frontend/src/tests/app`, `frontend/src/tests/slices/checkout-payment`, and `tests/slices/checkout-payment`.
- Repo-local combined checkout/frontend Jest rerun for affected areas.

## Non-goals
- No full localized copy rollout across catalog/checkout screens.
- No broader shell/runtime baseline work from `FT-009`.
- No new auth/session subsystem beyond the existing `checkout-payment` contour.
