# TASK-FT010-17 Handoff

## Scope
- `AdminRouter` no longer treats unsupported `/admin/*` paths as `assignment`.
- Unsupported admin paths now render explicit not-found feedback under `AdminShell` without triggering auth/login fallback semantics.
- Focused admin/root router smoke coverage now freezes the intended contour behavior.

## Evidence
- Jest: `npx jest --config jest.config.cjs frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx`
- ESLint: `npx eslint frontend/src/admin/app/router.tsx frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/app/root-router.spec.tsx`
- Artifact: `.tasks/TASK-FT010-17/TASK-FT010-17-S-IMPL-final-report-code-01.md`
