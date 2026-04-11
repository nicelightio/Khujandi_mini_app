# TASK-FT010-17 Progress

## 2026-04-11
- Loaded task/spec context from backlog, FT-010, requirements, EP-001, testing, and the `TASK-FT010-16` red-verification follow-up.
- Confirmed current drift: `frontend/src/admin/app/router.tsx` resolves unknown `/admin/*` paths to `adminRoutePaths.assignment`, and `frontend/src/tests/admin/admin-router.spec.tsx` freezes that behavior.
- Started implementation to make unknown admin paths explicit under the `admin-web` contour and extend smoke coverage.
- Replaced the admin-route fallback with explicit unknown-path handling in `AdminRouter` and added hostile route assertions in both admin and root router suites.
- Collected repo-local evidence: targeted Jest passed (`22` tests) and ESLint passed for all changed frontend files.
