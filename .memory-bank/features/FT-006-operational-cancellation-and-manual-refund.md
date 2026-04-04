---
description: Feature C4 L3 для операционной отмены заказа и ручного refund tracking.
status: active
---
# FT-006 Operational Cancellation And Manual Refund

## REQs

- `REQ-011`, `REQ-012`, `REQ-018`

## Use cases

- `admin` отменяет заказ по операционной причине.
- `courier` отменяет заказ только в allowed unavailable-case.
- Оператор фиксирует ручной refund workflow.

## Acceptance criteria

- Клиент не может инициировать отмену.
- `admin` может переводить заказ только в `CANCELLED_BY_ADMIN` из `CREATED`, `ASSIGNED` или `IN_PROGRESS`.
- `courier` может переводить заказ только в `CANCELLED_BY_COURIER_UNAVAILABLE` из `ASSIGNED` или `IN_PROGRESS` и только для unavailable-case.
- Отмена из `DELIVERED`, `COMPLETED` и любых `CANCELLED_*` статусов запрещена и не создает write side effects.
- Фиксируются `cancelled_by_user_id`, cancellation `reason_code`, `refund_status` и `refund_note` по правилам refund-state semantics.
- Отмена и refund действия попадают в аудит и события.

## Edge cases & failure modes

- Нельзя выполнить отмену из недопустимого состояния без явного серверного разрешения.
- Нельзя оставлять отмененный paid order без видимого refund tracking state.

## Constraints / invariants

- Refund в MVP ручной, но его состояние явно отражается в модели.
- `refund_status = NOT_REQUIRED` используется только когда отмененный заказ не требует возврата.
- Paid cancellation MUST сразу фиксировать `refund_status = PENDING_MANUAL`; дальнейшая ручная обработка переводит его только в `DONE` или `REJECTED`.
- `refund_note` может отсутствовать в момент самой отмены, но должен сохраняться при ручном завершении refund workflow как операторский контекст/результат.

## Verification boundary

- `TASK-FT006-01` фиксирует docs/spec layer: allowed actors, cancellation statuses, refund-state semantics, client prohibition и verify routing.
- `TASK-FT006-07` закрывает repo-local functional verification для authorized cancellation, forbidden attempts, audit/event generation и visible refund-state presence.
- `TASK-FT006-08` закрывает final manual-refund evidence sync: progression `PENDING_MANUAL -> DONE/REJECTED`, operator note capture, runbook-level closure и отсутствие paid cancelled orders без явного refund tracking state.

## Normative inputs

- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): cancellation states, ownership и refund boundary.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../runbooks/manual-refund-and-negative-alerts.md): operational refund handling.
- [.memory-bank/testing/index.md](../testing/index.md): cancellation/refund verification basis.

## Test strategy pointers

- e2e: admin/courier cancellation by allowed policy.
- integration: refund status transitions and audit/event generation.

## Implementation status

- `TASK-FT006-01` зафиксировал docs-first boundary: allowed actors/states, cancellation statuses, refund-state semantics и verify routing.
- `TASK-FT006-02` добавил backend `order-cancellation` scaffold, persistence baseline для cancellation/refund metadata и repo-local Jest harness; runtime command/refund behavior остается в следующих задачах `FT-006`.
- `TASK-FT006-03` добавил fixture-driven admin cancellation/refund route shell, explicit refund-state rendering и repo-local frontend smoke harness без втягивания backend/auth runtime scope.
- `TASK-FT006-04` реализовал backend authorized cancellation command: `admin`/assigned `courier` проходят server-side policy, успешная отмена пишет order/history/audit/event данные, а forbidden or invalid attempts остаются без write side effects.
- `TASK-FT006-05` реализовал backend manual refund progression: cancelled paid orders могут перейти только `PENDING_MANUAL -> DONE/REJECTED`, `refund_note` сохраняется как обязательный operator outcome, а успешный update пишет `refund_updated` audit/event без automated provider refund side effects.
- `TASK-FT006-06` подключил admin-web cancellation/refund UX к backend command contract через минимальный API client: UI теперь показывает controlled success/error outcomes для cancellation/refund submit, сохраняет explicit `refund_status`/`refund_note` visibility после команд и блокирует duplicate-submit side effects без добавления hidden frontend behavior.
- `TASK-FT006-07` расширил финальный repo-local verification suite: backend integration теперь явно показывает allowed-role cancellation, client prohibition, cancellation actor/reason persistence и canonical audit/event chain через `cancel -> refund update`, а admin frontend smoke удерживает explicit refund-state visibility для `CANCELLED_BY_ADMIN`, `CANCELLED_BY_COURIER_UNAVAILABLE` и manual refund outcome evidence.
- `TASK-FT006-08` синхронизировал final refund runbook evidence и docs closure: runbook/feature/RTM/backlog теперь явно подтверждают manual refund workflow, а `REQ-012` и `FT-006`-row для `REQ-018` закрыты в текущем repo-local scope.
