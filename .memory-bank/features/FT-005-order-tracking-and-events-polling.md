---
description: Feature C4 L3 для state machine заказа, истории статусов и polling событий.
status: active
---
# FT-005 Order Tracking And Events Polling

## REQs

- `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018`

## Use cases

- Курьер подтверждает заказ и ведет доставку через статусы.
- Клиент и админка видят обновления через polling.

## Acceptance criteria

- Только `courier` может выполнять post-assignment переходы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Сервер принимает только следующий разрешенный transition; skip/replay/regression/terminal attempts отклоняются с `409 CONFLICT` и не создают state/history/event side effects.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- Успешный status command возвращает актуальные `updated_at` и строковый `revision` для cheap polling.
- `GET /events?since=<cursor>` возвращает ordered event stream по возрастанию `revision`, а `since` и `next_cursor` трактуются как opaque string cursor values.
- Empty-window и duplicate polling requests остаются duplicate-safe: read path не создает domain side effects и возвращает согласованный string `next_cursor`.
- Event payload использует поля `type`, `entity`, `entity_id`, `payload`, `revision`, `created_at`.
- Решение должно поддерживать целевой polling SLA p95 <= 10 секунд.

## Edge cases & failure modes

- Дубликаты polling-запросов не должны ломать порядок или курсор.
- Невалидный переход не должен менять состояние заказа.
- Ошибки должны использовать единый error contract с `trace_id`.
- Resume после `activated/deactivated` не должен приводить к двойным status fetch/update side effects.

## Constraints / invariants

- Event format остается стабильным для future SSE/WS.
- Cursor contract остается string-only на API boundary; consumer не должен полагаться на numeric parsing `since`/`revision`/`next_cursor`.
- Функциональная корректность `FT-005` закрывается repo-local integration/e2e evidence, а финальное latency closure для `REQ-010` принадлежит отдельному SLA verify wave/task.

## Scope boundary

- `FT-005` владеет post-assignment lifecycle: `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Переход `CREATED -> ASSIGNED` и событие назначения курьера принадлежат `FT-004`.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): `/events`, event shape и error contract.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order lifecycle, transition ownership и terminal states.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../architecture/events-polling-and-bot-runtime.md): duplicate-safe runtime/polling baseline и ownership split.
- [.memory-bank/testing/index.md](../testing/index.md): quality gates и SLA-sensitive verification.

## Verification targets

- `PATCH /orders/{id}/status`
- `GET /events?since=<cursor>`
- Polling SLA verify evidence ownership for `REQ-010`

## Test strategy pointers

- e2e: courier drives order to `COMPLETED` and UI observes events.
- integration: state machine, history writes, ordered cursor polling.
- verify: SLA evidence on test load.

## Implementation status

- `TASK-FT005-01` freezes post-assignment state-machine ownership, `409 CONFLICT` semantics, string cursor contract, and explicit SLA verification ownership before backend/frontend scaffolding.
- `TASK-FT005-04` implements the backend courier status command with authenticated actor validation, assigned-courier ownership checks, adjacent transition enforcement, transactional history/event writes, and polling-friendly `updatedAt`/`revision` metadata.
- `TASK-FT005-03` adds a frontend polling-consumer scaffold and courier bot interaction harness so downstream UI/bot tasks can wire real runtime behavior without moving state-machine ownership into adapters.
- `TASK-FT005-05` implements the backend ordered polling read path so `GET /events?since=<cursor>` returns stable event objects with string `revision` / `nextCursor`, preserves ascending order, and stays duplicate-safe for empty-window and repeated requests without read-side writes.
