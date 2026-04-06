---
description: Execution plan for TASK-FT007-02.
status: in_progress
---
# TASK-FT007-02 Plan

1. Extend `backend/prisma/schema.prisma` with slice-owned admin credential/session/audit persistence that matches the current `FT-007` contract.
2. Scaffold `backend/src/slices/admin-access/{domain,application,infrastructure,presentation}` following existing backend slice patterns and keeping auth business invariants inside the slice.
3. Add focused repo-local unit/integration specs under `tests/slices/admin-access/` that cover credential verification baseline, lockout window helpers, session lifetime markers, and auth audit persistence wiring.
4. Wire `package.json` and `jest.config.cjs` so the new backend slice runs through the existing Jest harness.
5. Re-run targeted verification, then sync protocol/task artifacts and Memory Bank statuses.
