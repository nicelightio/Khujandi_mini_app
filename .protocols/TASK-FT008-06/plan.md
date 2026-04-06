---
description: План выполнения TASK-FT008-06.
status: active
---
# TASK-FT008-06 Plan

1. Добавить minimal bot-flow orchestrator поверх existing review harness и `reviews-feedback` controller.
2. Провести обе стороны flow через шаги `rating -> reason_code -> comment(optional)` с in-memory draft state без переноса review semantics в transport harness.
3. Завести controlled duplicate handling для step callbacks/comment submit и оставить final idempotency за backend submit path.
4. Добавить unit/integration smoke coverage для client/courier flow и duplicate-safe completion.
5. Прогнать quality gates, затем выполнить MB sync и task artifacts.
