# TASK-FT004-04 Plan

1. Extend `delivery-assignment` domain types/repository contract for an authenticated assignment command and transactional order update.
2. Implement service/controller validation for auth, RBAC, `CREATED -> ASSIGNED`, and courier target checks using `AppError`.
3. Update the Prisma repository so successful assignment persists order update, history, audit, and canonical `order.assigned` in one transaction.
4. Replace baseline tests with command-focused unit/integration coverage for success and failure/no-side-effect paths.
5. Run repo-local tests/typecheck for the slice and sync backlog/Memory Bank/task artifacts.
