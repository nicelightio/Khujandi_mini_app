---
description: Контекст выполнения TASK-FT008-07.
status: active
---
# TASK-FT008-07 Context

## Task
- TASK-ID: `TASK-FT008-07`
- Title: `Add reviews and negative-alert verification suite plus final docs sync`
- Feature: `FT-008`
- REQs: `REQ-013`, `REQ-014`

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/tasks/plans/IMPL-FT-008.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Scope focus
- Подтвердить repo-local evidence для двухстороннего bot-guided review flow.
- Подтвердить negative alert generation/fan-out для обеих сторон feedback loop.
- Синхронизировать final docs/RTM closure для `REQ-013` и `REQ-014`.

## Current state before work
- `TASK-FT008-06` закрыт: bot-guided runtime wiring реализован, quality gates пройдены, backlog/status sync выполнен.
- Repo уже содержит client-side bot-guided integration smoke и client-side low-rating negative alert integration.
- Вероятный remaining gap для final closure: explicit repo-local evidence для courier-side negative path через bot-guided flow.
