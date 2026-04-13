# TASK-FT011-07 Red Verification

## Semantic verdict
- `semantic-concern`

## Why
- `TASK-FT011-07` substantively closes the original provisioning race from `TASK-FT011-03`: duplicate admin provisioning intent now fails closed at the persistence boundary, and the hostile provisioning tests cover the intended concurrent retry case.
- But the chosen fix is a schema-level `Shop(sellerId, name)` uniqueness rule, and that same constraint now also governs ordinary seller shop renames.
- The seller rename path (`CatalogService.updateSellerShop(...)` -> `PrismaCatalogRepository.updateShop(...)`) does not translate the new uniqueness violation into a controlled business error, so a seller renaming one owned shop to another owned shop's name can now surface as an unhandled persistence error instead of the project error contract.

## Top substance risks
- `backend/prisma/schema.prisma:86` adds `@@unique([sellerId, name])` for all `Shop` writes, not just admin provisioning.
- `backend/src/slices/catalog/application/catalog.service.ts:169` and `:202` call the generic update path without any duplicate-name precheck or `P2002` mapping on seller renames.
- `backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts:271` performs the raw `shop.update(...)` inside a transaction, so the new DB conflict can escape as a persistence exception rather than a controlled `409`.
- Existing seller rename coverage (`tests/slices/catalog/catalog.integration.spec.ts:571`) only proves the happy path and does not cover name-collision behavior after the new schema constraint.

## Hidden assumptions
- Assumes the new canonical provisioning identity can safely double as a global seller-side rename invariant without any extra UX/error-contract work.
- Assumes same-seller duplicate shop names are either impossible in practice or acceptable to fail as a generic server error.

## Cross-boundary impact
- `FT-011` hardening changed behavior in the `FT-010` seller edit surface because seller shop renames share the same `Shop` table and update path.
- The new persistence rule is consistent with the provisioning contract, but its effect on the rename flow is not yet reconciled with the seller write contract's controlled-failure posture.

## Architectural concerns
- The persistence boundary now owns the right provisioning guarantee, but the broader application layer has not been normalized around the new invariant.
- This leaves one write path (`provisionSellerShop`) conflict-safe and contract-shaped, while another write path (`updateSellerShop`) can now fail with raw persistence semantics for the same underlying uniqueness rule.

## State/data consistency concerns
- No duplicate durable starter bundles were found for the original provisioning race; the task's primary data-integrity goal appears satisfied.
- The remaining concern is behavioral consistency at the same persistence boundary: the unique key protects data, but the rename command does not yet preserve the API's controlled-error contract when that protection fires.

## Operational concerns
- A seller rename collision is likely to look like an opaque `500`/unexpected failure in runtime instead of a controlled `409`, which weakens troubleshooting and operator confidence.
- Because there is no regression coverage for this path, future maintainers may assume the new uniqueness rule is fully integrated when it is only partially surfaced at the API boundary.

## Future maintenance cost
- Leaving the mismatch in place pushes the burden into later debugging around seller storefront edits, where the root cause will be a hidden side effect from an earlier provisioning hardening task.

## How this could still be wrong
- If the intended product rule is that same-seller duplicate shop names are impossible and the existing runtime already maps unknown persistence errors into a controlled conflict response, the concern would be narrower.
- That stronger guarantee was not evidenced in the loaded spec set or current seller rename tests.

## Counterproposal / escalation path
- Keep `TASK-FT011-07` done for the race-safe provisioning fix it delivered.
- Add a narrow follow-up to reconcile the new `Shop(sellerId, name)` invariant with the seller rename path: either precheck/map rename collisions to a controlled `409`, or explicitly freeze and test a different rename-conflict policy.
