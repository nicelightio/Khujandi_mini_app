---
description: Adversarial semantic verification for TASK-FT010-05.
status: active
---
# TASK-FT010-05 Red Verification

- Semantic verdict: `semantic-concern`

## Top substance risks
- `TASK-FT010-05` correctly tightened seller ownership and no-delete behavior locally, but it expanded seller shop/menu/product write coverage without any explicit `event` or `audit` semantics in the owning `catalog` slice.

## Hidden assumptions
- The current implementation assumes seller catalog edits are operationally insignificant enough to stay as silent writes.
- The current verify surface assumes create/update tests are sufficient even though global project invariants treat significant writes as observable domain changes.

## Cross-boundary impact
- Silent seller catalog writes can drift away from the project-wide event/audit posture used by other write-heavy slices.
- Future shared storefront edit-mode UX, store-admin flows, or operational troubleshooting may lack canonical change artifacts for who changed what and when.

## Architectural concerns
- The solution is locally clean inside `catalog`, but it leaves `catalog` as an exception to the global write-observability rule without an explicit spec carve-out.

## State/data consistency concerns
- No direct data corruption issue was found.
- `REQ-020` rename/snapshot behavior remains substantively intact because order snapshots live in `checkout-payment` and this task does not mutate them.

## Operational concerns
- Without event/audit artifacts, seller storefront edits are harder to diagnose, reconcile, or surface consistently once runtime/UI flows are mounted.

## Future maintenance cost
- Later `FT-010` UI/runtime tasks may need to retrofit events/audit after more write paths are mounted, increasing migration and verification cost.

## How this could still be wrong
- If product intent explicitly treats seller catalog edits as non-critical silent writes, this concern is overstated; that exception is not currently frozen in specs.

## Counterproposal
- Add a follow-up task to either:
  - implement catalog-owned event/audit publication for seller shop/menu/product writes, or
  - explicitly freeze and document a no-event exception if that is the true product/architecture intent.
