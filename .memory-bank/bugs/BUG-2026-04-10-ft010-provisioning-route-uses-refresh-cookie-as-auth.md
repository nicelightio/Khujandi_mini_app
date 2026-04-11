---
description: Semantic bug: FT-010 provisioning runtime authenticated privileged writes directly from the admin refresh cookie, bypassing the FT-007 protected-route session model.
status: archived
---
# BUG-2026-04-10 FT010 Provisioning Route Uses Refresh Cookie As Auth

## Summary
- `TASK-FT010-09` closed the anonymous admin provisioning gap, but the mounted route now authorizes `POST /api/v1/admin/catalog/shops/provision` directly from `khujandi_admin_refresh_token`.
- This makes the refresh cookie act as a bearer credential for a privileged admin write route instead of limiting it to `refresh/logout` chain semantics.

## Evidence
- `backend/src/dev-runtime/dev-api-server.ts` reads `khujandi_admin_refresh_token` inside `resolveAdminProvisioningSession(...)`, hashes it, loads the session, and allows provisioning without checking any access-token-backed protected-route boundary.
- The same helper only enforces `refreshTokenExpiresAt` and `idleExpiresAt`, so the `15 minute` access-token lifetime from `FT-007` / `REQ-017` is not part of the route authorization decision.
- Runtime coverage in `tests/slices/catalog/catalog.runtime.integration.spec.ts` proves anonymous/non-admin denial and `boss` success, but it never exercises an expired access-token / valid refresh-only state, so the suite can pass while the session model is semantically widened.

## Expected behavior
- Privileged admin writes should reuse the checked-in admin auth contour without turning the refresh cookie into a general-purpose auth bearer.
- `FT-007` session semantics stay intact: access-token lifetime remains meaningful for protected routes, while refresh cookie ownership stays limited to `POST /api/v1/admin/auth/refresh|logout` or an equivalent server-side restore boundary.

## Actual behavior
- A valid refresh cookie alone is sufficient to authorize provisioning requests until idle or refresh lifetime expiry.

## Impact
- Semantically weakens `REQ-017` and `FT-007` by bypassing the intended `15 minute` access-token lifetime for a privileged admin write.
- Creates future drift risk where additional admin routes may copy the same pattern and silently collapse the protected-route boundary into "refresh cookie = authenticated admin".
- Gives false confidence because the task-level tests verify the local bugfix intent but not the higher-level session-model substance.

## Required follow-up
- Introduce a real reusable protected admin route boundary for runtime writes that does not authenticate directly from the refresh cookie.
- Add regression coverage for "expired/missing access boundary but valid refresh cookie" so protected admin writes fail closed until a proper refresh/restore step happens.
- Re-run `/verify` and `/red-verify` after the boundary is corrected.

## Resolution
- Closed by `TASK-FT010-10`.
- `backend/src/slices/admin-access/presentation/admin-auth-http.ts` now exports a reusable protected admin runtime helper that requires the protected cookie boundary, validates the hashed `accessToken` against the persisted session record, and enforces `accessTokenExpiresAt` alongside refresh/idle/session validity.
- `backend/src/dev-runtime/dev-api-server.ts` now uses that helper for `POST /api/v1/admin/catalog/shops/provision` instead of resolving auth directly from `khujandi_admin_refresh_token`.
- `tests/slices/catalog/catalog.runtime.integration.spec.ts` now proves three regressions: refresh-only cookies fail `401`, forged access cookies fail `401`, and an expired protected admin session also fails `401` until `POST /api/v1/admin/auth/refresh` restores the session.
