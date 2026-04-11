---
description: Adversarial semantic verification for TASK-FT010-10.
---
# TASK-FT010-10 Red Verification

## Semantic verdict
- `semantic-pass`

## Re-run note
- Explicit `/red-verify TASK-FT010-10` re-check confirmed the same verdict after the final verify artifact and current checked-in change surface review.

## Top substance risks
- No remaining semantic break found in the checked-in protected admin provisioning boundary.

## Hidden assumptions
- The checked-in `FT-007` session model remains cookie-pair plus persisted session hashes rather than JWT/self-contained token verification.
- Prisma schema now documents `accessTokenHash`, but operational rollout/migration ownership still belongs to the broader `admin-access` persistence baseline rather than this repo-local runtime task alone.

## Cross-boundary impact
- Restores `FT-007` protected-route semantics for the mounted `FT-010` admin provisioning runtime path.
- Does not widen seller/admin auth models or introduce a parallel credential boundary.

## Architectural concerns
- The fix centralizes protected-route validation in `admin-auth-http` instead of keeping route-local session logic in `dev-api-server`.
- Session semantics remain cohesive: login/refresh own cookie issuance and rotation, protected writes reuse the same persisted session family.

## State/data consistency concerns
- No catalog-side consistency issue found; authorization fails before provisioning writes.
- Refresh rotation now updates both `accessTokenHash` and `refreshTokenHash`, keeping persisted session state aligned with the cookie pair.

## Operational concerns
- Runtime coverage now proves refresh-only, forged-access, and expired protected-session failures, reducing false confidence from narrow auth tests.
- No new uncontrolled side effects or retry hazards were identified in the provisioning path.

## Future maintenance cost
- Lower than before because future admin write routes can reuse one helper instead of copying ad hoc refresh-cookie logic.

## How this could still be wrong
- A future deploy path that applies Prisma schema drift without rolling out the corresponding DB column would break persistence outside the current repo-local test harness.

## Counterproposal / escalation path
- No follow-up task is required for the checked-in runtime/auth substance.
- If the project wants a stronger deploy guarantee, a separate ops/schema rollout task can formalize the `AdminSession.accessTokenHash` migration path.
