---
description: Adversarial semantic verification for TASK-FT010-09.
---
# TASK-FT010-09 Red Verification

## Semantic verdict
- `semantic-fail`

## Top substance risks
- The fix authenticates a privileged admin write directly from the refresh cookie, effectively turning refresh into a bearer for protected runtime writes.
- This weakens the already-established `FT-007` session model where the access token lifetime should matter for protected admin surfaces.

## Hidden assumptions
- Assumes "same session family" is equivalent to "refresh cookie alone may authorize protected writes".
- Assumes preserving `idle` and `refresh lifetime` checks is sufficient even when `access token = 15 minutes` becomes irrelevant for this route.

## Cross-boundary impact
- Regresses `FT-007` session semantics while trying to fix an `FT-010` runtime gap.
- Risks creating a copy-paste auth pattern for future `/api/v1/admin/*` write routes.

## Architectural concerns
- The guard is route-local and duplicates security logic instead of reusing a dedicated protected admin boundary.
- Session semantics are now split across `admin-auth-http.ts` and ad hoc route code in `dev-api-server.ts`.

## State/data consistency concerns
- No direct catalog state corruption was found in the current fix.
- The semantic issue is boundary correctness rather than write atomicity.

## Operational concerns
- Tests currently prove local RBAC/auth outcomes but not session-substance correctness.
- An operator could believe the route is aligned with `FT-007` while it actually bypasses the access-token lifetime model.

## Future maintenance cost
- Every future admin runtime route will need an explicit decision: reuse this refresh-cookie shortcut or implement a different guard.
- Leaving this in place increases auth drift and makes later consolidation harder.

## How this could still be wrong
- If the project explicitly intends refresh-cookie-based protected admin writes, then the issue would be spec drift rather than code drift; current `FT-007` docs do not support that interpretation.

## Counterproposal / escalation path
- Add one reusable admin protected-route runtime helper that validates the intended protected session boundary without using the refresh cookie as a direct auth bearer.
- Then retarget `TASK-FT010-09` to that helper and re-run `/verify` plus `/red-verify`.

## Evidence
- `backend/src/dev-runtime/dev-api-server.ts:694-733`
- `tests/slices/catalog/catalog.runtime.integration.spec.ts:21-135`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md:23-25,37,44-48`
- `.memory-bank/contracts/admin-auth-contract.md:29-30,35,44`
