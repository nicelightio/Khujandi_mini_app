---
description: ASCII-схема state machine заказа, cancellation/refund семантики и ownership по feature boundaries.
status: active
---
# Order Lifecycle And Feature Ownership

## Why this matters

- Схема фиксирует самый критичный cross-slice state contract MVP.
- Она помогает агенту не смешивать ownership между `FT-004`, `FT-005`, `FT-006` и `FT-008`.

## Diagram

```text
                                   FT-008 reviews-feedback
                                           |
                                           v
CREATED --FT-004/admin--> ASSIGNED --FT-005/courier--> IN_PROGRESS --FT-005/courier--> DELIVERED --FT-005/courier--> COMPLETED
   |                            |                               |
   |                            |                               |
   +-- FT-006/admin ----------> CANCELLED_BY_ADMIN <-----------+
                                ^
                                |
ASSIGNED --FT-006/courier unavailable--------------------------+
IN_PROGRESS --FT-006/courier unavailable----------------------> CANCELLED_BY_COURIER_UNAVAILABLE

paid cancel
   |
   v
refund_status: NOT_REQUIRED | PENDING_MANUAL | DONE | REJECTED

Every valid transition
   |
   +--> write order_status_history
   +--> publish domain event
   +--> keep invalid transition => 409 CONFLICT
```

## Ownership summary

- `FT-004` владеет переходом `CREATED -> ASSIGNED`.
- `FT-005` владеет переходами `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- `FT-006` владеет cancellation transitions и `refund_status` semantics.
- `FT-008` стартует после `COMPLETED` и использует результат lifecycle, но не меняет state contract заказа.

## Normative sources

- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md)
- [.memory-bank/features/FT-004-courier-assignment.md](../features/FT-004-courier-assignment.md)
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../features/FT-005-order-tracking-and-events-polling.md)
- [.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md](../features/FT-006-operational-cancellation-and-manual-refund.md)
- [.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md](../features/FT-008-two-sided-reviews-and-negative-alerts.md)
