---
description: Feature C4 L3 для desktop-first operator panel, delayed/unassigned alerts, courier availability и bot chat redirect.
status: active
---
# FT-016 Operator Orders Monitoring And Courier Offer Flow

## REQs

- `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-009`, `REQ-018`

## Product decisions

- KISS: no Redis, queues, GPS, map dashboard or complex dispatch optimization.
- `operator` is the operations role; `admin` includes all operator capabilities.
- Panel is desktop-first.
- Auto-offer is disabled by default.
- Privacy/PII hardening beyond existing auth/RBAC is not expanded in MVP.
- The admin/operator panel already has an implementation baseline; v2 work should repair and extend it rather than rebuild it from scratch unless code inspection shows the existing shape is cheaper to replace.

## Four blocks

1. `Operator Panel`: orders list, sorting, severity colors, expandable status history, action cells.
2. `Unassigned/Delayed Alert`: top blinking field with order numbers requiring courier attention and Telegram alerts to configured operators.
3. `Courier Availability + Auto-offer`: courier bot menu and first-claim-wins assignment.
4. `Bot Chat Redirect`: panel opens bot menu bound to order for communication with customer/courier/shop owner.

## Use cases

- Operator sees orders for today + previous 3 calendar days.
- Operator sees a blinking top alert for orders without accepted courier or in `DELAYED`.
- Operator/admin changes allowed statuses with confirmation and history/audit trail.
- Active free couriers receive an offer and first successful claimant gets the order.
- Courier manages work availability and auto-accept preference in bot menu.
- Operator jumps from panel to bot chat menu bound to a specific order.

## Acceptance criteria

### Operator panel

- Default list contains orders from today and previous 3 calendar days by `created_at`.
- Rows are sortable at least by urgency/severity, created time, status, courier assigned/absent, courier name, assigned time and last message time.
- Main row shows: order number, courier cell, write-to-customer/chat action, last message, current status control.
- Each order expands into status history rows.
- Status history row shows status name/time, time in status, time from order creation, actor name/role, and last comment columns for courier/admin/customer/shop owner.
- Comments are grouped to status by timestamp window; no complex explicit message-status relation is required.
- Comment preview shows first 2-3 words; click opens full text and bot chat action.

### Severity colors

- No accepted courier: light blue while fresh, escalates by age when delayed.
- Active delivery under 30 min from order creation: yellow.
- Active delivery 30-60 min: orange.
- Active delivery 60+ min: red.
- `DELAYED`: blinking red.
- Cancelled/not fulfilled: purple.
- `COMPLETED`: neutral/gray.
- `DELIVERED` still requires attention until operator/admin closes `COMPLETED`.

### Assignment / auto-offer

- Manual operator/admin assignment creates offer; courier must confirm before `ASSIGNED`.
- Auto-offer broadcasts to active free couriers only when enabled.
- Courier sees `пытаемся получить заказ...` while claim request is in flight.
- Server performs atomic claim; first successful courier sees success, concurrent losers see already-taken outcome.
- If nobody accepts after 3 minutes, repeat notification is sent.
- If nobody accepts after another 3 minutes, order becomes/remains `DELAYED`, operators get urgent alert.
- Personal offer timeout decreases courier `rating_score` by 1; broadcast timeout does not penalize a specific courier.

### Courier bot menu

- Bot has `Курьер` menu.
- Menu actions:
  - `Выйти на работу` / `Завершить прием заказов через 5 минут`.
  - `Автоматически принимать заказы: ON/OFF` — MVP meaning: courier participates in auto-offer, but still must confirm/claim each order.
- Active/free definition for MVP:
  - active: courier explicitly on work and not past stop-after-5-min window;
  - participates in auto-offer: courier toggle is ON;
  - free: courier has no current order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.

### Status control

- Operator/admin can change allowed statuses with confirmation popup.
- Popup states that the change is written to history.
- Comment is optional for regular status transitions and required for cancellation.
- `DELIVERED -> COMPLETED` is operator/admin-owned manual closure.

### Bot chat redirect

- Panel action redirects to bot with order context.
- Bot opens inline menu bound to that order: customer, courier, shop owner.
- Operator chooses recipient and continues chat in bot.
- Messages are stored in simple order communication model/read model sufficient for last-message and comment previews.

## Minimal data model targets

- `operator` role; `admin` implies operator capability.
- Courier fields: `is_active`, `accepting_orders_until`, `auto_offer_enabled`, `rating_score`.
- Assignment offer fields: `order_id`, optional `target_courier_id`, `kind=manual|broadcast`, `status=pending|claimed|expired|cancelled`, timestamps.
- Order communication fields: `order_id`, `sender_role`, `sender_name`, `text`, `created_at`, optional Telegram chat/message refs.

## Scope boundary

- `FT-004` owns assignment offer/claim domain semantics.
- `FT-005` owns lifecycle/history/events after assignment claim.
- `FT-006` owns cancellation/refund semantics.
- `FT-007/admin-access` owns web auth/session; this feature only consumes operator/admin RBAC.
- Telegram bot is a presentation contour and must not bypass server-side state machine or RBAC.
- Existing admin panel implementation is a migration input: tasks must inspect and adapt it before adding replacement UI surfaces.

## Migration / rollout notes

1. Treat existing FT-004/FT-005 implementation and admin panel as v1 baseline.
2. Decompose implementation into additive phases: schema/enums/read support → panel read fixes → courier availability/menu → offers/claims → timeout/delayed → `PICKED_UP`/operator completion → cleanup legacy direct assignment.
3. Keep new flow disabled or unreachable until backend claim, bot confirmation and panel read model are all coherent.
4. Existing orders remain readable and operational during rollout; new v2 behavior should apply to newly created/claimed orders after the relevant phase is enabled.
5. The panel repair task must preserve working admin features unrelated to delivery operations.
6. Rollback must be possible by disabling auto-offer/offer creation while leaving legacy order list and old assigned orders readable.
7. Operator delivery list UI baseline is a 4-column table-card hybrid (`Заказ`, `Курьер`, `Последнее сообщение`, `Действия`) rather than the older 8-column grid, so delivery operations remain scannable around 1024px and narrow layouts can collapse into per-order cards.

## Out of scope

- GPS courier tracking, maps, ETA, geofencing.
- Redis/queues/background worker architecture.
- Complex dispatch optimization by distance/rating/route.
- Full CRM chat UI inside web panel; MVP redirects to bot.
- Advanced privacy/PII tooling beyond existing auth/RBAC/audit baseline.

## Normative inputs

- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): updated lifecycle, `DELAYED`, `PICKED_UP`, operator completion.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../contracts/operator-delivery-ops-contract.md): read/command contract for operator delivery ops.
- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): courier menu, offer/claim and chat redirect behavior.
- [.memory-bank/features/FT-004-courier-assignment.md](FT-004-courier-assignment.md): assignment offer/claim.
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](FT-005-order-tracking-and-events-polling.md): status history/events/polling.

## Verification targets

- Operator panel renders 4-day list, severity colors and expandable history.
- Race test proves exactly one courier can claim a broadcast offer.
- Timeout test proves 3+3 minute delayed escalation and operator notification.
- Bot menu test proves courier active/stop/auto-offer toggles.
- Status control test proves confirmation, history actor and `409 CONFLICT` on invalid transition.

## Verification status

- `TASK-FT016-18` verified the repo-local v2 operator delivery flow with `PASS`: paid order creation, unassigned operator visibility, manual offer, courier claim into `ASSIGNED`, courier progress through `PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator/admin `COMPLETED`, polling visibility, disabled normal legacy assignment, and old v1 active order readability.
- `TASK-FT016-19` syncs the Memory Bank closure for that evidence and leaves the task as `ready_for_verify`; verifier role remains separate.
- Historical failed task evidence remains preserved: `TASK-FT016-07` repaired by `TASK-FT016-07-FIX`, `TASK-FT016-13` repaired by `TASK-FT016-13-FIX`, `TASK-FT016-15` repaired by `TASK-FT016-15-FIX`, and `TASK-FT016-17` repaired by `TASK-FT016-17-FIX`.

## Residual debt / risk

- Real Android Telegram smoke for the full v2 operator/courier/customer path was not run during `TASK-FT016-18`/`TASK-FT016-19`; it remains advisory pre-release evidence unless separately requested.
- Production deploy smoke, real Telegram delivery of courier bot callbacks, and real bot chat execution were not part of repo-local closure.
- Bot chat redirect remains MVP redirect/harness scope; full CRM-style chat UI is still out of scope.
- Redis, queues, GPS/maps/routing optimization, and worker/cron dispatch architecture remain explicitly out of scope for MVP.
