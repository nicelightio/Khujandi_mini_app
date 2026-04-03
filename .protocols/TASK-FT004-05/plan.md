---
description: Execution plan for TASK-FT004-05.
status: active
---
# TASK-FT004-05 Plan

1. Add a minimal Telegram bot notifier boundary owned by transport, not assignment rules.
2. Extend `delivery-assignment` application flow so successful assignment triggers targeted courier notification after persistence result is available.
3. Make notification retry-safe by avoiding any extra assignment write path and by surfacing delivery outcome separately from domain mutation.
4. Add unit/integration coverage for targeted dispatch, no-broadcast default, and assignment side-effect safety on notifier failure.
5. Sync protocol progress and Memory Bank/backlog/changelog/report artifacts.
