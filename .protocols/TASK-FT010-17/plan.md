# TASK-FT010-17 Plan

1. Inspect current `admin-web` route resolution and existing smoke coverage.
2. Replace the implicit unknown admin fallback with explicit not-found behavior inside the admin contour.
3. Update focused router tests to prove unknown `/admin/*` paths do not resolve to assignment or login fallbacks.
4. Run targeted Jest and ESLint gates for changed files.
5. Sync Memory Bank and task status after verification evidence is captured.
