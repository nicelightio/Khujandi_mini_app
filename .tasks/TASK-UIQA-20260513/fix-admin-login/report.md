---
description: Admin login direct-route cookie session restore fix report.
status: final
---
# TASK-UIQA-20260513 Fix Admin Login

## Result

Fixed the admin QA Medium finding: direct `/admin/login` now attempts the existing admin cookie refresh flow and redirects/restores to the protected admin home when the cookie session is valid.

The change stays inside the `admin-access` slice, `admin-web` contour, and frontend presentation/application shell layer.

## Files Inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `reports/ui-qa/20260513-1821-admin-web-staging.md`
- `frontend/src/admin/app/router.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `frontend/src/tests/admin/admin-auth-runtime.spec.tsx`
- `frontend/src/admin/model/admin-access-shell.ts`
- `frontend/src/admin/components/admin-login-page.tsx`

## Files Changed

- `frontend/src/admin/app/router.tsx`
  - Reused the existing refresh path for `/admin/login`, not only protected routes.
  - Preserved explicit logout feedback by marking `/admin/login` refresh as already attempted immediately after logout.
- `frontend/src/tests/admin/admin-router.spec.tsx`
  - Added regression coverage for restoring an authenticated cookie session from the explicit login route.
  - Updated the explicit login route test to assert one refresh attempt with an anonymous result.

## Checks Run

- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-router.spec.tsx --runInBand` — passed.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/admin/admin-auth-runtime.spec.tsx --runInBand` — passed.
- `npx eslint frontend/src/admin/app/router.tsx frontend/src/tests/admin/admin-router.spec.tsx` — passed.
- `npx tsc -p tsconfig.jest.json --noEmit` — failed on existing unrelated catalog/delivery/test type errors outside this task scope; no reported error pointed to the changed files.

## Blockers/Risks

- No blocker for this fix.
- Full TypeScript gate is currently blocked by pre-existing unrelated errors in broader repo scope.
- Staging browser re-run was not performed in this subtask; the focused frontend/runtime tests cover the fixed route behavior.

## Recommendation

Re-run the admin-web staging UI QA direct `/admin/login` check after deploying this change to confirm the browser-visible Medium finding is closed.
