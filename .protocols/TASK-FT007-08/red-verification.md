---
description: Adversarial semantic verification for TASK-FT007-08.
status: active
---

# TASK-FT007-08 Red Verification

- Semantic verdict: `semantic-fail`

## Top substance risk

- The new handler exists only as an exported helper and in test-only wiring; it is not connected to any checked-in runtime entrypoint that the actual admin web app uses.

## Hidden assumptions

- The implementation assumes that adding `backend/src/slices/admin-access/presentation/admin-auth-http.ts` is equivalent to exposing a real repo runtime endpoint.
- The tests assume a dedicated ad hoc server created in `tests/slices/admin-access/admin-auth-runtime.test-helpers.ts`, not the checked-in app/runtime entrypoint used by local development.

## Cross-boundary impact

- `frontend/src/admin/api/admin-auth-api.ts` calls `/api/v1/admin/auth/*` through the default browser fetch path.
- `vite.config.mjs` proxies `/api` to `http://127.0.0.1:3001`, but `scripts/dev-api.mjs` still serves only catalog routes and no admin auth endpoints.
- As a result, the actual repo-local admin web runtime remains unable to authenticate end-to-end without a test-only server assumption.

## Architectural concerns

- Runtime ownership is still split: the auth boundary lives in a reusable helper, while the only checked-in server entrypoint does not mount it.

## State/data consistency concerns

- None beyond the runtime integration gap were proven in this pass.

## Operational concerns

- The current docs and verification surface give false confidence that the repo runtime serves admin auth, while the shipped local runtime path still does not.

## Future maintenance cost

- Future contributors may keep extending tests around the helper while the real runtime remains unmounted, compounding drift between docs and executable behavior.

## How this could still be wrong

- There could be an unstated out-of-repo server entrypoint, but no checked-in runtime adapter or script in this repository currently proves that.

## Counterproposal

- Wire `createAdminAuthHttpHandler` into the actual checked-in backend runtime entrypoint used by `/api` in local/dev flows, then verify against that runtime instead of a test-only ad hoc server.
