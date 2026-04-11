---
description: План выполнения TASK-FT010-13.
---
# TASK-FT010-13 Plan

## Scope
- Add explicit `catalog`-owned events for seller shop, menu page, and product write operations.
- Keep the external controller/service API unchanged.
- Update specs and task artifacts so the observability policy is explicit and test-backed.

## Steps
1. Extend the Prisma-backed `catalog` repository so seller write operations persist an event atomically with the data mutation.
2. Add focused integration regressions for shop/menu/product write observability.
3. Update FT-010/contract/invariants/changelog/index/backlog docs to freeze the chosen policy.
4. Run targeted verification and record the evidence in protocol/task artifacts.

## Notes
- The goal is explicit observability, not a new cross-slice reporting capability.
- MVP baseline for this task is event-backed observability; a dedicated catalog audit store remains out of scope unless later specs require it.
