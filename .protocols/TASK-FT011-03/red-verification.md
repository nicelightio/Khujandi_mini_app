# TASK-FT011-03 Red Verification

## Semantic verdict
- `semantic-concern`

## Why
- Task closes the narrow sequential replay case for identical `sellerId + telegramId + shop name`, but the new guard lives in `CatalogService` as a non-atomic read-before-write precheck.
- The repository/database path still has no canonical uniqueness guarantee for that provisioning identity, so concurrent identical requests can both pass the precheck and create duplicate durable records.

## Top substance risks
- `backend/src/slices/catalog/application/catalog.service.ts:109` only checks existing bindings before calling `repository.provisionSellerShop(...)`, which is race-prone under concurrent retries.
- `backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts:426` writes the provisioning bundle transactionally, but it does not enforce a unique provisioning key or conflict check inside the transaction.
- `backend/prisma/schema.prisma:121` keeps `SellerShopBinding.shopId` unique, yet there is no DB-level uniqueness on the repeated provisioning identity (`sellerId + telegramId + shop name` or an equivalent canonical key), so the `P2002` fallback is not a reliable duplicate shield for identical retries.

## Hidden assumptions
- Assumes duplicate provisioning happens only sequentially, not as concurrent admin retries or repeated delivery of the same intent.
- Assumes a service-layer precheck is sufficient even though the contract says duplicate/conflicting provisioning must fail closed, which usually requires repository/DB-level enforcement.

## Cross-boundary impact
- Admin provisioning can still violate `REQ-028` under concurrency while appearing correct in unit/integration coverage that only exercises serialized calls.
- Later mounted-runtime durability work could inherit duplicate starter shops/bindings as if they were canonical persisted truth.

## Architectural concerns
- Conflict handling is split between application precheck and best-effort repository exception mapping, but the authoritative duplicate guarantee is not owned at the persistence boundary.

## State/data consistency concerns
- Two identical provisioning requests issued close together can both create `shop + binding + starter catalog` bundles because the current precheck observes stale absence and the schema does not reject the second commit.

## Operational concerns
- Manual admin retries, browser double-submit, or future transport retries can still produce duplicate shops even though the API now looks conflict-safe in serialized tests.

## Future maintenance cost
- If this remains unfixed, later runtime/read-path tasks may need cleanup logic for duplicate provisioned shops instead of relying on one canonical provisioning result.

## How this could still be wrong
- If the intended contract for this task was strictly limited to serialized duplicate requests in the repo-local runtime, then the concern is narrower than a full semantic break.

## Counterproposal / escalation path
- Keep `TASK-FT011-03` done for the sequential replay hardening it delivered.
- Follow-up `TASK-FT011-07` should move duplicate/conflict enforcement onto a race-safe repository/DB boundary, for example via a canonical unique key and/or transactional conflict detection that remains correct under concurrent retries.
