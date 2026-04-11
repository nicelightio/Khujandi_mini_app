# TASK-FT010-03 Red Verification

## Semantic verdict
- semantic-fail

## Top substance risks
- The mounted provisioning runtime path is open without admin auth or RBAC, so the implementation solves "create a provisioning endpoint" but not the real requirement of an admin-side provisioning command.

## Hidden assumptions
- Assumes `/api/v1/admin/...` path naming is enough to imply admin-only access.
- Assumes later UI wiring will add the missing security boundary without current runtime misuse risk.

## Cross-boundary impact
- Affects `catalog` write safety and the shared `admin-access` session boundary.
- Undermines future `TASK-FT010-04` seller capability resolution by allowing unauthorized creation of seller-bound shops.

## Architectural concerns
- Creates a second write surface under the admin contour without reusing the checked-in admin auth boundary.
- Introduces drift between documented `admin-side provisioning` intent and actual runtime behavior.

## State/data consistency concerns
- Atomicity is implemented, but unauthorized callers can still create valid persistent shop/binding state, so consistency is preserved for the wrong actors.

## Operational concerns
- No negative runtime evidence for anonymous/non-admin callers.
- Open write route increases misuse risk in local/dev and any environment reusing this runtime mounting pattern.

## Future maintenance cost
- If downstream tasks build on this endpoint shape, later retrofitting auth/RBAC will force API/test rewrites and can normalize an unsafe pattern.

## How this could still be wrong
- Even if UI calls come only from admin screens, the runtime remains semantically wrong because enforcement lives outside the trusted server boundary.

## Counterproposal
- Reuse the existing admin auth/session family on the provisioning path and require authenticated admin role before calling the catalog provisioning command.
- Add anonymous/non-admin runtime tests before restoring task closure.
