---
description: Implementation plan для FT-005 order tracking and events polling.
status: active
---
# IMPL-FT-005

## Goal

Доставить `FT-005` как owning `delivery-tracking` slice: курьер проводит заказ через серверно-разрешенные переходы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`, каждый валидный переход пишет историю и событие, а клиенты читают ordered changes через `GET /events?since=<cursor>` со строковым курсором и verify evidence для polling SLA p95 <= 10 секунд.

## Current state

- `FT-004` уже декомпозирован для перехода `CREATED -> ASSIGNED`, поэтому `FT-005` продолжает lifecycle только с post-assignment статусов.
- Contracts для `/events` и order lifecycle уже зафиксированы в normative layer, но implementation plan/backlog для `delivery-tracking` пока отсутствуют.
- Shared `events` и `telegram-bot` runtime contours уже описаны архитектурно; `FT-005` должен использовать их без переноса state machine semantics в shared transport.

## REQs

- `REQ-008`
- `REQ-009`
- `REQ-010`
- `REQ-018`

## Normative inputs

- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../features/FT-005-order-tracking-and-events-polling.md): acceptance criteria, edge cases, scope boundary и verification targets.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../epics/EP-002-delivery-operations.md): parent epic success metrics и delivery constraints.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../contracts/api-events-baseline.md): `/events`, ordered `revision`, string `cursor`/`next_cursor` и error contract.
- [.memory-bank/contracts/telegram-bot-contract.md](../../contracts/telegram-bot-contract.md): courier bot action baseline и `order.status_changed` notification semantics.
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md): ownership переходов `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`, `409 CONFLICT` rule и terminal boundaries.
- [.memory-bank/invariants.md](../../invariants.md): auth/RBAC, event generation, `order_status_history` и string cursor invariants.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../architecture/events-polling-and-bot-runtime.md): shared event transport, duplicate-safe polling/bot runtime rules и ownership split.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): ownership `order_status_history` и event persistence.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и SLA-sensitive verification baseline.

## Constraints

- `FT-005` владеет только post-assignment lifecycle; assignment и cancellation остаются вне scope.
- Все переходы валидируются server-side state machine; невалидный transition возвращает `409 CONFLICT` и не пишет side effects.
- Каждый валидный transition обязан писать `order_status_history`, доменное событие и command response metadata (`updated_at`, `revision`) там, где это нужно для cheap polling.
- `GET /events?since=<cursor>` обязан возвращать ordered events по возрастанию `revision` и строковый `next_cursor`.
- Event format остается стабильным и совместимым для future SSE/WS migration.
- Resume/retry polling и bot-driven courier actions не должны создавать duplicate domain side effects.

## Steps

1. Freeze docs-first ownership для post-assignment state machine, polling contract и SLA verification scope.
2. Scaffold backend `delivery-tracking` slice, persistence touchpoints и backend test harness без выноса state-machine бизнес-правил в `shared`.
3. Scaffold minimal polling consumer/runtime shell для admin/customer visibility и courier status interaction harness.
4. Реализовать status command flow с auth/actor validation, `409 CONFLICT`, `order_status_history`, audit/error contract и status event publication.
5. Реализовать ordered `GET /events?since=<cursor>` read path со string cursor semantics и duplicate-safe polling behavior.
6. Подключить courier/admin/customer-facing polling consumers к event stream без двойных side effects после resume/retry.
7. Добавить integration/e2e coverage, отдельный SLA verification bundle и docs sync по acceptance criteria `FT-005`.

## Expected touched files

- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/index.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/delivery-tracking/**/*`
- `backend/src/shared/**/*`
- `tests/slices/delivery-tracking/**/*`
- `frontend/src/app/**/*`
- `frontend/src/slices/order-tracking/**/*`
- `frontend/src/tests/slices/order-tracking/**/*`
- `backend/src/integrations/telegram-bot/**/*`

## Tests

- backend integration: разрешенные courier transitions проходят только по `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- backend integration: невалидный transition возвращает `409 CONFLICT` без изменения состояния, history и events.
- backend integration: каждый валидный transition пишет `order_status_history`, event и command response metadata (`updated_at`, `revision`).
- backend integration: `GET /events?since=<cursor>` возвращает ordered stream, string `next_cursor` и duplicate-safe поведение на повторных запросах.
- e2e: courier доводит заказ до `COMPLETED`, а admin/customer polling consumers видят ordered updates.
- verify: отдельный SLA evidence bundle подтверждает polling p95 <= 10 секунд на agreed MVP load profile.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for delivery tracking and polling
- verify ordered event stream and polling SLA evidence for `FT-005`

## UAT steps

1. Подготовить заказ в статусе `ASSIGNED` и выполнить courier-driven переходы до `COMPLETED`.
2. На каждом шаге убедиться, что backend принимает только валидный следующий transition и отклоняет невалидный с `409 CONFLICT`.
3. Проверить, что каждый валидный transition создает запись в `order_status_history`, доменное событие и возвращает актуальные `updated_at`/`revision`.
4. Запросить `GET /events?since=<cursor>` и убедиться, что stream отсортирован по `revision`, а `next_cursor` сериализован строкой.
5. Повторить polling с тем же курсором и после resume/reconnect; убедиться, что порядок не ломается и duplicate side effects отсутствуют.
6. Собрать verify evidence по latency и подтвердить, что polling p95 укладывается в целевой SLA.
