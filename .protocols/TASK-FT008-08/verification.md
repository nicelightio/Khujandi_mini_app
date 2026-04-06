---
description: Верификация TASK-FT008-08.
status: active
---
# TASK-FT008-08 Verification

## Basis

- Backlog `TASK-FT008-08`: stale/replayed step callbacks must stop mutating active draft, while final persisted submit remains duplicate-safe.
- `IMPL-FT-008-BUGFIX-review-callback-replay-hardening`: callback payload must carry revision identity and `handleCallback()` must ignore stale step callbacks.
- `FT-008`: review flow and negative alert semantics from `REQ-013` / `REQ-014` must remain intact.
- `telegram-bot-contract`: callback payload must include prompt revision identity and stale callback must short-circuit before draft mutation.

## Planned checks

- repo-local unit/integration tests for `reviews-feedback`
- explicit stale callback regression for `rating` and `reason_code`
- regression for duplicate-safe final submit and `review.negative` fan-out

## Checks Performed

1. Code inspection
- Verified revision-aware transport payload wiring in `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`.
- Verified draft stores expected `stage + revision` and rejects mismatches with `ignored/stale_callback` in `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`.

2. Evidence inspection
- Verified stale replay regressions exist in `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts` and `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`.
- Verified regression coverage still exercises duplicate-safe final submit and low-rating fan-out behavior.

3. Deterministic execution
- Command: `npm run test:reviews-feedback`
- Result: PASS (`2` suites, `18` passed, `1` todo, `0` failed)

## Acceptance Mapping

1. Stale/replayed step callbacks no longer mutate active draft
- Evidence: flow checks `matchesExpectedStep(...)` before mutating draft for rating/reason/comment transitions.
- Evidence: integration regression replays old rating and reason callbacks and expects `ignored/stale_callback`.
- Status: PASS

2. Intermediate wizard transitions are revision-aware
- Evidence: callback payload now includes `revision`; prompt buttons encode revision-scoped callback data; draft stores `expectedStage` and `expectedRevision`.
- Status: PASS

3. Final persisted review submit remains duplicate-safe
- Evidence: full `npm run test:reviews-feedback` suite passes, including duplicate final callback coverage.
- Status: PASS

4. `review.negative` semantics remain intact
- Evidence: full `npm run test:reviews-feedback` suite passes, including low-rating publication and active-admin fan-out coverage.
- Status: PASS

## Verdict

- PASS

## Evidence

- Command: `npm run test:reviews-feedback`
- Code refs:
  - `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
  - `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
  - `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts`
  - `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`

## Residual note

- `TASK-FT008-09` remains valid follow-up for process-local draft durability/restart guarantees; it does not block this stale-callback hardening verify result.
