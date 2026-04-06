---
description: Adversarial semantic verification report for TASK-FT007-08.
status: active
---

# TASK-FT007-08 Red Verification Report

## Verdict

- `semantic-fail`

## Primary finding

- `backend/src/slices/admin-access/presentation/admin-auth-http.ts` adds a real handler, but no checked-in runtime entrypoint mounts it.
- `scripts/dev-api.mjs` remains the only repo-local HTTP server used by `vite.config.mjs` proxy and still serves only catalog routes, so `/api/v1/admin/auth/login|refresh|logout` are not actually reachable in the real app runtime.

## Evidence

- `createAdminAuthHttpHandler` is referenced only inside the new test helper.
- `frontend/src/tests/admin/admin-auth-runtime.spec.tsx` proves a test-only server created from `tests/slices/admin-access/admin-auth-runtime.test-helpers.ts`, not the checked-in runtime used by the app.
- `vite.config.mjs` proxies `/api` to `http://127.0.0.1:3001` while `scripts/dev-api.mjs` exposes no admin auth routes.

## Outcome

- The task passes process-level `/verify`, but fails semantic verification because it does not yet solve the real runtime problem described by the original bug.
- Follow-up bug/task were added to restore truthful tracking.
