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
- Заказ переводится в разрешенный cancellation status с reason code.
- Фиксируются `cancelled_by_user_id`, `refund_status` и при необходимости `refund_note`.
- Отмена и refund действия попадают в аудит и события.

## Edge cases & failure modes

- Нельзя выполнить отмену из недопустимого состояния без явного серверного разрешения.
- Нельзя оставлять отмененный paid order без видимого refund tracking state.

## Constraints / invariants

- Refund в MVP ручной, но его состояние явно отражается в модели.

## Normative inputs

- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): cancellation states, ownership и refund boundary.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../runbooks/manual-refund-and-negative-alerts.md): operational refund handling.
- [.memory-bank/testing/index.md](../testing/index.md): cancellation/refund verification basis.

## Test strategy pointers

- e2e: admin/courier cancellation by allowed policy.
- integration: refund status transitions and audit/event generation.
