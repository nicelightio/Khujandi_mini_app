---
description: Implementation plan для FT-004 courier assignment.
status: deprecated
---
# IMPL-FT-004

## Superseded note

- Superseded by the FT-016/updated FT-004 target: assignment is now offer + courier claim; pending offer does not set `ASSIGNED`. Keep this file only as historical implementation evidence for the legacy direct-assignment wave.

## Goal

Доставить `FT-004` как owning `delivery-assignment` slice: разрешенный администратор вручную назначает курьера на оплаченный заказ, заказ переходит в `ASSIGNED`, публикуется `order.assigned`, а назначенный курьер получает actor-targeted уведомление через Telegram-бота.

## Current state

- Delivery operations (`FT-004`, `FT-005`, `FT-006`) еще не разложены в implementation backlog, хотя upstream customer ordering flow уже доводит заказ до состояния `CREATED` после оплаты.
- Contracts для events и Telegram-бота уже существуют в normative layer, но assignment-specific docs freeze и execution plan пока отсутствуют.
- `admin-access` еще не декомпозирован отдельно, поэтому `FT-004` должен использовать существующий/будущий auth boundary как dependency, не втягивая login/session scope в assignment feature.

## REQs

- `REQ-007`
- `REQ-018`

## Normative inputs

- [.memory-bank/features/FT-004-courier-assignment.md](../../features/FT-004-courier-assignment.md): acceptance criteria, edge cases и scope boundary.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../epics/EP-002-delivery-operations.md): parent epic success criteria и delivery constraints.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-007`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../contracts/api-events-baseline.md): event shape, `revision`/`cursor` baseline и error contract.
- [.memory-bank/contracts/telegram-bot-contract.md](../../contracts/telegram-bot-contract.md): `order.assigned` outbound delivery rule и anti-broadcast policy.
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md): ownership перехода `CREATED -> ASSIGNED` и обязательный `order_status_history` write.
- [.memory-bank/invariants.md](../../invariants.md): auth/RBAC, event generation и no-broad-broadcast invariants.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): owning slice `delivery-assignment` и `admin-web` contour boundary.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../architecture/events-polling-and-bot-runtime.md): publication/runtime semantics для event + bot transport.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): ownership `orders` и `order_status_history` без cross-slice invariant drift.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и assignment verification baseline.

## Constraints

- Только разрешенная admin-role может инициировать assignment.
- `FT-004` владеет только переходом `CREATED -> ASSIGNED`; следующие переходы не входят в scope.
- Assignment write flow обязан валидировать текущее состояние заказа и не обходить server-side state machine.
- Успешный assignment обязан писать audit trail, `order_status_history` и доменное событие `order.assigned`.
- Успешный assignment command-response обязан нести актуальные `updated_at` и string `revision` для downstream polling/read refresh.
- Assignment notification по умолчанию идет только назначенному курьеру; broad broadcast не допускается.
- Error responses обязаны соответствовать `{ error: { code, message, details }, trace_id }`.

## Steps

1. Freeze docs-first assignment boundary, targeted notification policy и verification ownership для `FT-004`.
2. Scaffold backend `delivery-assignment` slice, persistence touchpoints и backend test harness без выноса assignment business rules в `shared`.
3. Scaffold minimal admin-web assignment route/model shell и test harness, не затрагивая login/session scope `FT-007`.
4. Реализовать backend assignment command с auth/RBAC, state validation, `CREATED -> ASSIGNED` transition, audit trail и `order.assigned` publication.
5. Реализовать targeted courier notification integration через existing bot/runtime boundary и failure-safe delivery semantics без broad broadcast.
6. Подключить admin assignment UX к backend flow, включая optimistic/progress/error states по единому error contract.
7. Добавить integration/e2e coverage, docs sync и RTM consistency check по acceptance criteria `FT-004`.

## Expected touched files

- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/index.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/shared/**/*`
- `tests/slices/delivery-assignment/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`
- `backend/src/integrations/telegram-bot/**/*`

## Tests

- backend integration: разрешенная admin-role успешно назначает курьера и переводит заказ в `ASSIGNED`.
- backend integration: unauthorized role, invalid order state и невалидный courier target возвращают controlled error contract без side effects.
- backend integration: successful assignment пишет audit trail, `order_status_history` и `order.assigned` event.
- backend integration/contract: bot notification dispatch идет только назначенному курьеру.
- admin-web e2e: оператор назначает курьера на заказ и видит успешное подтверждение.
- verify: acceptance criteria `FT-004` полностью закрыты repo-local evidence без выхода в scope `FT-005`/`FT-007`.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for admin assignment flow
- verify audit/event/notification evidence for `FT-004`

## UAT steps

1. Подготовить оплаченный заказ в статусе `CREATED` и открыть admin assignment flow.
2. Назначить валидного курьера под разрешенной admin-role и убедиться, что заказ перешел в `ASSIGNED`.
3. Проверить, что в ответе/последующем чтении есть актуальные `updated_at` и `revision`, а в transport слое опубликован `order.assigned`.
4. Проверить audit trail и `order_status_history` для assignment action.
5. Убедиться, что уведомление ушло только назначенному курьеру, без broad broadcast другим участникам.
6. Повторить запрос с неразрешенной ролью, невалидным состоянием заказа и невалидным courier target; убедиться, что side effects отсутствуют и возвращается единый error contract.
