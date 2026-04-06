---
description: Adversarial semantic verification for TASK-FT008-08.
status: active
---
# TASK-FT008-08 Red Verification

## Semantic verdict

- semantic-concern

## Top substance risks

- The stale-callback bug itself is fixed in substance: intermediate callback buttons are now revision-scoped and older prompt callbacks are rejected before draft mutation.
- The broader review-stepper runtime remains process-local and non-durable. A restart or cross-instance hop still converts a valid next user action into `missing_draft`, which means the fix is semantically correct for stale callbacks but does not make the bot flow operationally robust.

## Hidden assumptions

- The implementation still assumes one long-lived process owns the active draft for the whole bot conversation.
- It also assumes the externally supplied `startFlow(...revision)` is a meaningful prompt identity for the current rating prompt and is not silently reused in a way that would broaden callback validity more than intended.

## Cross-boundary impact

- `reviews-feedback` ownership remains correctly inside the slice; no domain logic leaked into transport.
- `review.negative` and duplicate-safe final submit semantics remain covered and unchanged.
- No direct conflict with `REQ-013` / `REQ-014` was found.

## Architectural concerns

- The fix increases local correctness with minimal cost, which is good.
- However, the architecture still relies on ephemeral process memory for a user-facing wizard, so the boundary is safer against stale Telegram callbacks but still fragile against runtime topology events.

## State/data consistency concerns

- Draft mutation is now revision-aware for callback-driven steps.
- Persisted review uniqueness and negative-alert single-fan-out behavior still protect write-side consistency.
- No new persisted-state inconsistency was introduced by this task.

## Operational concerns

- Telegram retries and delayed button presses are now handled more safely.
- Restart/redeploy/scale-out behavior is still not semantically hardened; users can still hit `missing_draft` while doing the right thing.

## Future maintenance cost

- The chosen change is minimal and maintainable.
- Future cost remains in the unresolved draft-durability/runtime-guarantee decision tracked by `TASK-FT008-09`.

## How this could still be wrong

- If MVP implicitly needs restart-safe or multi-instance-safe review continuity, the current solution may create false confidence because stale callbacks are fixed while the broader runtime fragility remains.
- If prompt revisions are ever reused too broadly by the caller of `startFlow()`, the transport-level protection could become weaker than it looks in repo-local tests.

## Counterproposal / escalation path

- Keep `TASK-FT008-08` accepted as a real fix for the stale callback gap.
- Do not treat the full review-stepper runtime as semantically hardened until `TASK-FT008-09` makes the draft guarantee explicit or durable.
- If the product expects resilience across restart/redeploy/scale-out, prioritize `TASK-FT008-09` before calling the bot review flow operationally reliable.
