---
description: HOW-гайд по раскладке persistence logic, data snapshots, soft-delete и state journals.
status: active
---
# Storage And State Implementation

## Related architecture

- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): WHAT/WHY для data ownership и persistence boundaries.

## Backend persistence rules

- Prisma repositories и DB access живут в infrastructure-слое owning slice.
- Shared DB helpers допустимы, shared domain mutations нет.
- Snapshot и explicit state fields сохраняются как часть продукта, а не как incidental implementation detail.

## What to persist explicitly

- `shop_name_snapshot` в заказе;
- `payment_provider_tx_id` для trusted payment confirmation;
- `refund_status` и `refund_note`;
- `order_status_history` для lifecycle journal;
- `refresh_token_hash` и auth audit для admin-access.

## Query policy checklist

- учтен ли `is_deleted`;
- не нарушается ли ownership чужого slice;
- нужна ли транзакция для write + event;
- сохраняется ли audit trail.

## Frontend/client state rules

- cart state живет в `checkout-payment` model или явно согласованном cross-slice store;
- session/ui state живет в `shared/state`;
- временные review/status steppers живут в owning slice model.

## Source artifacts

- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): таблицы и явные поля MVP.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): shared boundary rules.
