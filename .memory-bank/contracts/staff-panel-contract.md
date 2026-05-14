---
description: Boundary contract для Staff panel: staff roster, operator/courier metrics, soft delete и rating adjustments.
status: active
---
# Staff Panel Contract

## Purpose

Закрепить границу `Staff panel` в `admin-web` без переноса delivery lifecycle, review flow или auth/session правил в новый общий слой.

## Roles

- `admin`: открывает Staff panel, добавляет operator/courier, soft-delete/deactivate, меняет manual rating adjustment.
- `boss`: включает права `admin`, видит archived staff, re-activates staff, reset password operator-а и меняет nickname.
- `operator`: не имеет доступа к Staff panel.
- `courier`: не имеет web-login; работает через Telegram-бота.

## Staff types

### Courier staff

- Identity source: `User` с ролью `COURIER`.
- Required create input: `telegram_user_id`, `nickname`.
- Web password не создается.
- Runtime interaction channel: Telegram bot.

### Operator staff

- Identity source: `AdminAccount` с ролью `OPERATOR`.
- Required create input: `nickname`, `email`, `password`.
- `email` является login identity.
- Password storage MUST use one-way `password_hash`.
- New password MAY be displayed only once on create/reset; current saved password MUST NOT be readable.
- Staff panel MUST NOT create `ADMIN` or `BOSS` accounts.

## Visibility and lifecycle

- Default staff lists show active staff only.
- `admin` does not see soft-deleted staff.
- `boss` can access archived/soft-deleted staff.
- `admin` can soft-delete/deactivate staff.
- `boss` can re-activate staff.
- `hard delete` is out of current requirements.
- Historical order/review/audit references MUST remain valid after soft delete.

## Commands

### Create courier

Allowed actors: `admin`, `boss`.

Creates a courier staff profile with:

- `telegram_user_id`;
- `nickname`;
- creator actor;
- created timestamp;
- active status.

### Create operator

Allowed actors: `admin`, `boss`.

Creates only operator-level access:

- `nickname`;
- `email`;
- `password_hash`;
- creator actor;
- created timestamp;
- active status.

Rejected cases:

- requested role is not `OPERATOR`;
- duplicate/conflicting email;
- invalid password according to admin auth policy.

### Soft delete / deactivate

Allowed actors: `admin`, `boss`.

Effects:

- staff becomes inactive/soft-deleted;
- staff disappears from `admin` default list;
- historical references remain visible where they are part of order/review/audit history.

### Reactivate

Allowed actors: `boss` only.

Effects:

- staff returns to active lists;
- command writes actor and timestamp metadata.

### Rating adjustment

Allowed actors: `admin`, `boss`.

Effects:

- applies `+1` or `-1` manual adjustment to the relevant order/processed-order rating;
- does not mutate average review rating;
- writes adjustment actor, delta, optional reason and timestamp.

### Operator password reset

Allowed actors: `boss` only.

Effects:

- replaces `password_hash`;
- revokes active operator sessions according to admin auth policy;
- returns the new password only in the reset response/display once.

## List read models

### Couriers table

- `nickname`
- `telegram_user_id`
- `active_status`
- `delivered_orders_count`
- `courier_order_rating`
- `courier_average_review_rating`
- `unsuccessful_percent`

### Operators table

- `nickname`
- `email`
- `active_status`
- `processed_orders_count`
- `operator_rating`

## Card read models

### Common fields

- added by;
- added at;
- active/soft-deleted state;
- deactivation/reactivation history;
- manual rating adjustment history.

### Courier card

- last 10 courier orders;
- last 10 problem orders: unfinished, future-`FAILED`, or client review rating `1`;
- delivered orders count;
- order rating;
- average client review rating;
- unsuccessful percent.

### Operator card

- last 10 processed orders;
- last 10 problem orders: future-`FAILED`, or write-touched but not personally completed;
- processed orders count;
- operator rating.

## Metric rules

- `courier_order_rating = floor(delivered_orders_count / 100) + manual_rating_adjustment + automatic_penalties`.
- `delivered_orders_count` counts assigned courier orders that reached `DELIVERED`; this is scoped to staff rating and does not change the global successful order KPI `COMPLETED`.
- `courier_average_review_rating` is read-only and comes from client-to-courier reviews.
- `operator_rating = floor(processed_orders_count / 100) + manual_rating_adjustment`.
- `processed_orders_count` counts unique orders with at least one operator write-action; read-only viewing does not count.
- `unsuccessful_percent` uses the current terminal/problem states until a separate `FAILED` lifecycle decision exists.

## Audit and errors

- All create, soft-delete, reactivate, rating adjustment and password reset commands MUST write actor metadata.
- Errors follow the global shape `{ error: { code, message, details }, trace_id }`.
- Sensitive values such as plaintext password input MUST NOT be logged. One-time password display on create/reset is UI response state, not audit payload.

## Source artifacts

- [.memory-bank/features/FT-019-staff-panel.md](../features/FT-019-staff-panel.md): feature scope and acceptance.
- [.memory-bank/contracts/admin-auth-contract.md](admin-auth-contract.md): password/session policy.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](operator-delivery-ops-contract.md): operator delivery write-actions.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): lifecycle states and terminal/problem states.
