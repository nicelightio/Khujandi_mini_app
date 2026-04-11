---
description: Semantic bug: FT-010 admin provisioning runtime path was mounted without admin auth/RBAC enforcement.
status: archived
---
# BUG-2026-04-10 FT010 Admin Provisioning Runtime Open Without Admin Auth

## Summary
- `TASK-FT010-03` mounted `POST /api/v1/admin/catalog/shops/provision`, but the checked-in runtime path is callable without any admin authentication or RBAC check.
- This is a semantic break relative to the `admin-side provisioning` contract: the feature now exposes an admin capability as an open write surface.

## Evidence
- Runtime handler in `backend/src/dev-runtime/dev-api-server.ts` directly calls `catalogController.provisionShop(...)` for `POST /api/v1/admin/catalog/shops/provision`.
- No admin session lookup, role check, or origin-bound guard is applied on that route before the provisioning call.
- Existing runtime test `tests/slices/catalog/catalog.runtime.integration.spec.ts` exercises the endpoint successfully without any admin login/bootstrap step.

## Expected behavior
- Admin provisioning must require authenticated admin context and fail closed for anonymous or non-admin callers.
- The mounted runtime path should reuse the checked-in admin auth/session family rather than opening a parallel unprotected command path.

## Actual behavior
- Any caller that can reach the route can provision shops by supplying `sellerId`, `telegramId`, and `name`.

## Impact
- Violates `REQ-025` substance: provisioning is no longer genuinely admin-side in runtime behavior.
- Creates an unauthorized catalog write surface under an `/admin/*` URL prefix, giving false confidence from happy-path tests.
- Risks downstream seller access logic (`TASK-FT010-04`) building on a compromised provisioning boundary.

## Required follow-up
- Introduce authenticated admin boundary and RBAC enforcement for the provisioning command path.
- Add negative runtime tests for anonymous/non-admin callers.
- Re-run `/verify` and `/red-verify` after the auth boundary is fixed.

## Resolution
- Closed by `TASK-FT010-09`.
- The mounted runtime route now requires the existing admin cookie/session family plus allowed-origin posture before provisioning executes.
- Repo-local runtime coverage now proves `401 AUTH_REQUIRED` for anonymous callers, `403 FORBIDDEN` for authenticated `manager`, and preserved `201/409` behavior for authenticated `boss` provisioning requests.
