---
description: Implementation plan for TASK-FT005-04.
status: active
---
# TASK-FT005-04 Plan

1. Extend `delivery-tracking` domain types with command-level actor/input contracts and allowed post-assignment status unions.
2. Implement service-level auth, role, assigned-courier, missing-order, deleted-order, and adjacent-transition validation with project-standard `AppError` responses.
3. Tighten repository write flow so status persistence still writes `order`, `order_status_history`, and `event` transactionally and rejects stale/invalid state without side effects.
4. Replace baseline tests with command-focused unit/integration coverage for the valid chain, invalid transitions, actor validation, and polling-friendly response metadata.
5. Sync protocol progress, backlog/docs statuses, and final task report.
