---
description: Implementation plan для FT-006 operational cancellation and manual refund.
status: active
---
# IMPL-FT-006

## Goal

Доставить `FT-006` как owning `order-cancellation` slice: только разрешенные роли могут отменять заказ в разрешенных состояниях, cancellation фиксирует reason code и инициатора, unpaid/no-refund case явно маркируется `refund_status = NOT_REQUIRED`, а paid-cancel flow всегда входит в manual refund tracking через `refund_status = PENDING_MANUAL` с дальнейшим `DONE/REJECTED` outcome и обязательными audit/event side effects.

## Current state

- `FT-004` и `FT-005` уже декомпозированы для assignment и tracking, поэтому `FT-006` закрывает cancellation/refund branch внутри delivery operations.
- State model и operational runbook для manual refund уже зафиксированы в normative layer, но implementation plan/backlog для `order-cancellation` пока отсутствуют.
- Shared event transport и error contract уже описаны архитектурно; `FT-006` должен переиспользовать их без попытки ввести automated refund processing.

## REQs

- `REQ-011`
- `REQ-012`
- `REQ-018`

## Normative inputs

- [.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md](../../features/FT-006-operational-cancellation-and-manual-refund.md): acceptance criteria, edge cases и scope boundary.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../epics/EP-002-delivery-operations.md): parent epic success metrics и cancellation constraints.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-011`, `REQ-012`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../contracts/api-events-baseline.md): error contract и command response baseline.
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md): cancellation states, allowed actors, forbidden states и `refund_status` rules.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../../runbooks/manual-refund-and-negative-alerts.md): manual refund operating procedure и expected operator steps.
- [.memory-bank/invariants.md](../../invariants.md): client-cannot-cancel, manual refund state visibility и auth/RBAC invariants.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../architecture/events-polling-and-bot-runtime.md): event publication rules и duplicate-safe runtime boundary.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): ownership `refund_status`, `refund_note`, cancellation actor/reason persistence.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и cancellation/refund verification baseline.

## Constraints

- Клиент не может отменять заказ ни при каких условиях MVP.
- `admin` может выполнять только разрешенные operational cancellations; `courier` может отменять заказ только в unavailable-case и только из разрешенных статусов.
- Невалидная отмена не должна менять состояние заказа или refund fields.
- Успешная отмена обязана явно отражать `refund_status`; отсутствие refund tracking state недопустимо.
- `NOT_REQUIRED` допустим только для no-refund case; paid cancellation обязана сразу фиксировать `PENDING_MANUAL`.
- `DONE/REJECTED` появляются только как результат отдельного manual refund update после cancellation commit и не reopen-ят order lifecycle.
- Refund в MVP остается manual workflow; никаких auto-refund side effects.
- Cancellation и refund actions обязаны использовать единый error contract и фиксироваться в audit/events.

## Steps

1. Freeze docs-first cancellation policy, allowed actors/states, `NOT_REQUIRED/PENDING_MANUAL/DONE/REJECTED` semantics и verify boundary.
2. Scaffold backend `order-cancellation` slice, persistence touchpoints и backend test harness без выноса cancellation business rules в `shared`.
3. Scaffold minimal operator/admin cancellation UX shell и test harness, не затрагивая unrelated review flows.
4. Реализовать cancellation command flow с auth/RBAC, allowed-state validation, reason/actor persistence, controlled error contract и cancellation event publication.
5. Реализовать manual refund tracking baseline с `refund_status`, `refund_note`, audit trail и explicit paid-cancel semantics.
6. Подключить operator cancellation/refund UX к backend flow с явными success/error/refund-state confirmations.
7. Добавить integration/e2e coverage, final verify evidence и docs sync по acceptance criteria `FT-006`, сохранив split между cancellation functional closure и final manual refund evidence sync.

## Expected touched files

- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/index.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/order-cancellation/**/*`
- `backend/src/shared/**/*`
- `tests/slices/order-cancellation/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`

## Tests

- backend integration: `admin` может отменять заказ только в разрешенных состояниях; `courier` может отменять только в unavailable-case.
- backend integration: клиент/неразрешенная роль/неразрешенное состояние получают controlled error contract без side effects.
- backend integration: successful cancellation пишет cancellation actor/reason, audit trail, event и корректный cancellation status.
- backend integration: no-refund cancellation фиксирует `NOT_REQUIRED`, paid cancellation всегда фиксирует `PENDING_MANUAL`, а manual refund updates сохраняют `DONE/REJECTED`, `refund_note` и audit.
- e2e: operator/admin выполняет allowed cancellation и видит refund tracking state.
- verify: acceptance criteria `FT-006` полностью закрыты repo-local evidence без выхода в review/negative-alert scope.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for cancellation/refund flow
- verify cancellation authorization, refund tracking and audit/event evidence for `FT-006`

## UAT steps

1. Подготовить заказы в разрешенных и запрещенных для cancellation состояниях.
2. Выполнить отмену под `admin` и убедиться, что заказ переходит в `CANCELLED_BY_ADMIN`, причина и инициатор сохранены, а side effects зафиксированы.
3. Выполнить unavailable-case отмену под `courier` и убедиться, что заказ переходит в `CANCELLED_BY_COURIER_UNAVAILABLE` только в разрешенном сценарии.
4. Проверить, что клиент или неразрешенная роль не может инициировать cancellation и получает единый error contract.
5. Для no-refund/paid-cancel cases убедиться, что `refund_status` явно установлен (`NOT_REQUIRED` либо `PENDING_MANUAL`); при дальнейшей ручной обработке сохраняются `DONE/REJECTED`, `refund_note` и audit trail.
6. Проверить event/audit записи и отсутствие auto-refund side effects.
