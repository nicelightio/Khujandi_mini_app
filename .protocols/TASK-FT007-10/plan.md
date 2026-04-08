# TASK-FT007-10 Plan

1. Mark backlog state `ready -> in_progress`.
2. Replace the customer-only root bootstrap with a shared root bootstrap that branches on `window.location.pathname`.
3. Keep changes minimal by reusing existing `AppRouter` and `AdminRouter` instead of adding a second HTML entrypoint.
4. Add/extend frontend smoke coverage for `/admin/login` and a customer route.
5. Run targeted frontend tests plus `npm run build:frontend`.
6. Sync feature/changelog/backlog docs after successful verification.
