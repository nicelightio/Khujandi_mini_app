---
description: Active semantic bug because TASK-FT007-08 added an auth handler but did not wire it into the checked-in backend runtime entrypoint.
status: active
---
# BUG-2026-04-06 FT-007 Admin Auth Handler Not Mounted In Runtime

## Summary

`TASK-FT007-08` added `backend/src/slices/admin-access/presentation/admin-auth-http.ts`, but the repository still does not mount this handler into the actual checked-in backend runtime used by the app. The implementation therefore fixes the code surface and tests around a helper, yet leaves the real admin-web runtime path unresolved.

## Detection

- Date: `2026-04-06`
- Detection mode: `/red-verify TASK-FT007-08`
- Reviewed files:
  - `backend/src/slices/admin-access/presentation/admin-auth-http.ts`
  - `tests/slices/admin-access/admin-auth-runtime.test-helpers.ts`
  - `frontend/src/tests/admin/admin-auth-runtime.spec.tsx`
  - `vite.config.mjs`
  - `scripts/dev-api.mjs`

## Evidence

- Repository search shows `createAdminAuthHttpHandler` is referenced only by `tests/slices/admin-access/admin-auth-runtime.test-helpers.ts`.
- `frontend/src/admin/api/admin-auth-api.ts` calls `/api/v1/admin/auth/*` through the default browser runtime path.
- `vite.config.mjs` proxies `/api` requests to `http://127.0.0.1:3001`.
- `scripts/dev-api.mjs`, the checked-in repo-local server at that target, still serves only catalog routes and no admin auth endpoints.

## Expected behavior

- The checked-in backend runtime used by local/dev app flows must expose `/api/v1/admin/auth/login|refresh|logout` and mount the new handler there.

## Actual behavior

- The new handler is test-mounted only.
- The real repo-local runtime path still does not expose the admin auth endpoints.

## Impact

- `TASK-FT007-08` is not correct in substance.
- `FT-007` runtime closure remains unreliable until the checked-in runtime actually mounts the admin auth boundary.

## Suggested fix

- Wire `createAdminAuthHttpHandler` into the checked-in backend runtime entrypoint used by `/api` in local/dev flows.
- Replace or extend the current runtime smoke so it proves the mounted app/runtime, not only a test-created server.

## Follow-up artifacts

- Backlog task: `TASK-FT007-09`
- Red verification: `.protocols/TASK-FT007-08/red-verification.md`
