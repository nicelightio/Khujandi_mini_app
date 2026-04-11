---
description: План выполнения TASK-FT010-10.
---
# TASK-FT010-10 Plan

## Scope
- Rework mounted admin provisioning auth to reuse a real protected admin runtime helper.
- Add runtime regression coverage for missing/expired protected access boundary while refresh cookie is still valid.
- Sync docs/protocol artifacts after verification.

## Steps
1. Extract a reusable protected admin route helper near the existing `admin-auth-http` runtime boundary.
2. Switch `POST /api/v1/admin/catalog/shops/provision` to that helper instead of refresh-only session resolution.
3. Extend runtime test helpers if needed to simulate missing access cookie and expired protected session windows.
4. Run targeted runtime/admin tests, then sync Memory Bank and protocol outputs.

## Notes
- Checked-in runtime does not persist/verify access-token hashes server-side, so the minimal correct closure in repo reality is a protected cookie-pair boundary backed by session state and `accessTokenExpiresAt`, not a brand new credential model.
