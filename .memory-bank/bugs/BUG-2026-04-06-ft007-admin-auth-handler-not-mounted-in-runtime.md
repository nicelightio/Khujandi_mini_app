---
description: Archived semantic bug that existed until TASK-FT007-09 mounted the admin auth handler into the checked-in backend runtime entrypoint.
status: archived
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

## Actual behavior at detection time

- The new handler was test-mounted only.
- The real repo-local runtime path did not expose the admin auth endpoints.

## Impact at detection time

- `TASK-FT007-08` was not correct in substance.
- `FT-007` runtime closure remained unreliable until the checked-in runtime actually mounted the admin auth boundary.

## Resolution

- `TASK-FT007-09` introduced a shared checked-in dev runtime server and mounted `createAdminAuthHttpHandler` into that real repo-local entrypoint.
- `package.json` `dev:api` now starts the TypeScript entrypoint `scripts/dev-api.ts` through a small loader, so `/api/v1/admin/auth/login|refresh|logout` are served by the same checked-in runtime used by local app flows.
- Runtime-backed tests now target that mounted server module instead of a test-only ad hoc server shell.

## Suggested fix

- Wire `createAdminAuthHttpHandler` into the checked-in backend runtime entrypoint used by `/api` in local/dev flows.
- Replace or extend the current runtime smoke so it proves the mounted app/runtime, not only a test-created server.

## Follow-up artifacts

- Backlog task: `TASK-FT007-09`
- Red verification: `.protocols/TASK-FT007-08/red-verification.md`
