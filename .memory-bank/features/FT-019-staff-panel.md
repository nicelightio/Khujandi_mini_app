---
description: Feature C4 L3 для Staff panel в admin-web: операторы, курьеры, lifecycle, рейтинги и рабочая история.
status: active
---
# FT-019 Staff Panel

## REQs

- `REQ-038`, `REQ-015`, `REQ-016`, `REQ-017`, `REQ-018`

## Implementation status

- `2026-05-14`: `TASK-FT019-10` final verification passed for repo-local scope. Backend Staff persistence/commands/read models/runtime API and admin-web `/admin/staff` route/tables/commands/cards are implemented and verified; full repo `tsc` remains red only on non-Staff/mixed residual drift with clean filtered Staff diagnostics.
- `2026-05-14`: Post-review closure passed in [.tasks/TASK-FT019-POSTREVIEW/TASK-FT019-POSTREVIEW-S-02-final-report-code-07.md](../../.tasks/TASK-FT019-POSTREVIEW/TASK-FT019-POSTREVIEW-S-02-final-report-code-07.md): P1 repairs for Staff-created/reset operator auth and Staff-deactivated courier operational inactivity are verified, P3 `REQ-038` RTM drift is closed, and no open findings remain.
- `2026-05-14`: Local staging UI QA passed in [.tasks/TASK-FT019-UIQA/TASK-FT019-UIQA-S-01-final-report-ui-qa-01.md](../../.tasks/TASK-FT019-UIQA/TASK-FT019-UIQA-S-01-final-report-ui-qa-01.md) with artifacts under [reports/ui-qa/playwright/staff-panel-FT019-local](../../reports/ui-qa/playwright/staff-panel-FT019-local) and archive pointer [reports/ui-qa/20260514-1001-staff-panel-FT019-local.md](../../reports/ui-qa/20260514-1001-staff-panel-FT019-local.md). No serious or minor blocking browser findings were found. Residual risk: this local staging QA does not prove production deploy, Telegram WebView/HMAC behavior, or real payment-provider trust boundaries.

## Product decisions

- Панель называется `Staff panel`.
- `Staff panel` живет в `admin-web` contour и доступен только ролям `admin` и `boss`.
- `operator` не имеет доступа к `Staff panel`.
- Панель содержит две таблицы: `Couriers` и `Operators`.
- `hard delete` сотрудников не входит в требования; используется только soft delete / deactivate.
- Soft-deleted сотрудники скрыты от `admin`, но доступны `boss` в archive/filter view.
- `reactivate` доступен только `boss`.
- Plaintext password storage запрещен: операторский пароль хранится как hash; новый пароль показывается `boss` только один раз при create/reset.

## Use cases

- `admin` или `boss` открывает `Staff panel` и видит active staff.
- `admin` добавляет курьера по `telegram_user_id` и желаемому `nickname`; дальнейший courier workflow идет через Telegram-бота.
- `admin` добавляет оператора по `nickname`, `email` и `password`; создается только operator-level web login.
- `admin` делает soft delete/deactivate сотрудника.
- `admin` меняет ручную корректировку рейтинга/кармы сотрудника на `+1` или `-1`.
- `boss` видит archive soft-deleted сотрудников и может re-activate.
- `boss` может reset password оператора и изменить nickname.
- `boss` получает новый пароль оператора только в момент create/reset; текущий сохраненный пароль не отображается.

## Staff identity and persistence split

- Courier staff profile опирается на `User` с ролью `COURIER`, `telegram_user_id` и `nickname`.
- Operator staff profile опирается на `AdminAccount` с ролью `OPERATOR`, `email/login`, `password_hash` и `nickname`.
- Admin/boss accounts не создаются через `Staff panel`; они bootstrap/env-managed и остаются вне staff provisioning UI.
- Operator creation through `Staff panel` MUST NOT allow creation of `admin` or `boss` accounts.

## Tables

### Couriers table

- nickname;
- Telegram user id;
- active / soft-deleted status;
- delivered orders count;
- order rating;
- average client review rating `1..5`;
- unsuccessful percent.

### Operators table

- nickname;
- email;
- active / soft-deleted status;
- processed orders count;
- rating.

## Metrics

### Courier metrics

- `delivered_orders_count`: количество заказов, где этот courier был assigned courier и довел заказ до `DELIVERED`.
- Для staff-рейтинга курьера `DELIVERED` считается выполненным заказом, хотя общий successful order KPI проекта остается `COMPLETED`.
- `courier_order_rating = floor(delivered_orders_count / 100) + manual_rating_adjustment + automatic_penalties`.
- Ручная корректировка `+1/-1` применяется только к `courier_order_rating`.
- `automatic_penalties` включает уже зафиксированное снижение за timeout персонального offer.
- `courier_average_review_rating`: read-only средняя клиентская оценка курьера по review rating `1..5`; не смешивается с order rating.
- `unsuccessful_percent = unsuccessful_courier_orders / assigned_courier_orders * 100`.
- До отдельного lifecycle decision по `FAILED` неуспешными считаются assigned courier orders, которые не дошли до `DELIVERED` и завершились текущими terminal/problem states (`CANCELLED_BY_ADMIN`, `CANCELLED_BY_COURIER_UNAVAILABLE`).
- Future `FAILED` является бизнес-термином Staff panel и может быть добавлен в unsuccessful bucket только отдельным lifecycle decision; `FT-019` сам не добавляет order status `FAILED`.
- Active unfinished statuses (`ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`) не входят в `unsuccessful_percent`, но показываются в проблемном блоке карточки.

### Operator metrics

- `processed_orders_count`: количество уникальных заказов, по которым operator сделал хотя бы одно write-действие.
- Read/open/view order не считается обработкой.
- Несколько write-действий одного оператора по одному заказу дают максимум `+1` к `processed_orders_count`.
- Write-действия включают manual offer, status change, cancellation, refund update, completion and bot-chat/order communication writes when they mutate order-operational state.
- `operator_rating = floor(processed_orders_count / 100) + manual_rating_adjustment`.
- `completion_rate_percent` для operator table не используется.

## Staff cards

### Common card fields

- кто добавил сотрудника;
- когда добавил;
- active / soft-deleted status;
- кто и когда soft-deleted;
- кто и когда re-activated;
- история ручных изменений рейтинга: actor, delta `+1/-1`, optional reason, timestamp.

### Courier card

- Telegram user id и nickname;
- последние 10 заказов курьера;
- проблемный блок: последние 10 заказов, которые незавершены, future-`FAILED` или получили клиентский rating `1`;
- delivered orders count, order rating, average client review rating, unsuccessful percent.

### Operator card

- email и nickname;
- последние 10 обработанных заказов;
- проблемный блок: последние 10 заказов, которые operator закрыл как future-`FAILED` или брал в работу через write-действие, но не завершил лично;
- processed orders count и operator rating.

## Scope boundary

- `FT-019` владеет `admin-web` staff panel UX, staff roster commands, staff cards and staff-level rating adjustment semantics.
- `admin-access` владеет login/password, session, lockout, password hash and operator `AdminAccount` auth semantics.
- `delivery-assignment` владеет courier availability, offer/claim and existing automatic penalty semantics.
- `delivery-tracking` владеет order lifecycle, status history and operator write-action evidence.
- `reviews-feedback` владеет review payloads and courier average review rating source data.
- `FT-019` does not introduce `FAILED` order status; future failed-order lifecycle requires a separate lifecycle/state-machine decision.

## Verification targets

- `admin` can add operator/courier, soft-delete staff and adjust rating, but cannot see soft-deleted staff or reactivate them.
- `boss` can see archived staff, reactivate staff, reset operator password and change nickname.
- `operator` cannot access `Staff panel`.
- Operator creation creates only role `OPERATOR` and never `ADMIN`/`BOSS`.
- Password is stored only as hash and visible only once on create/reset.
- Courier metrics use `DELIVERED` for `delivered_orders_count` while global order success remains `COMPLETED`.
- Operator `processed_orders_count` counts unique orders with write actions only.

## Normative inputs

- [.memory-bank/contracts/staff-panel-contract.md](../contracts/staff-panel-contract.md): Staff panel boundary contract.
- [.memory-bank/contracts/admin-auth-contract.md](../contracts/admin-auth-contract.md): admin/operator auth, password hash and session policy.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../contracts/operator-delivery-ops-contract.md): operator delivery actions and order write evidence.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): current lifecycle and explicit lack of `FAILED`.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](FT-016-operator-orders-monitoring-and-courier-offer-flow.md): courier availability, auto-offer and operator delivery surface.
