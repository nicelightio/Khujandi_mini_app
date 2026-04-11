---
description: Adversarial semantic verification for TASK-FT010-14.
---
# TASK-FT010-14 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- The change promotes seller write observability into an explicit repository contract, but the checked-in in-memory adapter still persists those artifacts into a private `sellerWriteEvents` list instead of the project-wide shared `events` store semantics required by spec/invariants.
- This means adapter parity is currently proven only at the shape/return-value level, not at the operational sink level that downstream runtime/event consumers would rely on.

## Hidden assumptions
- Assumes that any explicit event-like artifact is semantically equivalent to the shared `events` store.
- Assumes no future checked-in runtime path will depend on the same event sink semantics across adapters.

## Cross-boundary impact
- `catalog` now advertises adapter parity more strongly than it actually delivers operationally.
- Future runtime/event integrations could pass tests built around `sellerWriteEvents` yet still drift from the real event-store contract used elsewhere in the monolith.

## Architectural concerns
- A second event sink concept now exists in the in-memory adapter (`sellerWriteEvents`) alongside the canonical shared `events` store used by Prisma-backed slices.
- This weakens the original intent of eliminating adapter-level observability drift.

## State/data consistency concerns
- No direct data corruption was found.
- The concern is semantic consistency of the observability sink, not mutation correctness.

## Operational concerns
- Repo-local runtime parity tests do not prove that alternate adapters would behave like the shared event sink under future polling/debugging/observability consumers.

## Future maintenance cost
- Every future adapter or runtime harness may now have to decide whether to follow `sellerWriteEvents` or the canonical shared `events` store model unless this is resolved explicitly.

## How this could still be wrong
- If project intent is that non-persistent adapters only need explicit write artifacts, not a shared sink analogue, then the current change may be acceptable, but that bounded exception is not frozen explicitly in spec/docs.

## Counterproposal
- Open a follow-up task to either:
  - align the in-memory/runtime adapter with one shared event-store abstraction/shape, or
  - explicitly freeze a bounded spec exception that only persisted adapters are normative for shared `events` store semantics.
