---
description: Feature C4 L3 для state machine заказа, истории статусов и polling событий.
status: active
---
# FT-005 Order Tracking And Events Polling

## REQs

- `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018`, `REQ-035`

## Use cases

- Курьер после successful claim ведет доставку через статусы.
- Operator/admin видит и контролирует delivery progress в desktop-first панели.
- Клиент и админка видят обновления через polling.
- Customer-facing status visibility after paid order creation is specified in `FT-014`; this feature remains the owner of lifecycle/event semantics.

## Acceptance criteria

- Post-assignment lifecycle: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Courier может вести delivery до `DELIVERED`: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`.
- `DELIVERED -> COMPLETED` выполняет `operator` или `admin` вручную; `DELIVERED` требует внимания и не является successful KPI.
- Operator/admin может выполнять разрешенные status changes по варианту control/override: confirmation popup, предупреждение о записи в историю, actor role/name в history/audit, optional comment для обычных transitions.
- Сервер принимает только следующий разрешенный transition; skip/replay/regression/terminal attempts отклоняются с `409 CONFLICT` и не создают state/history/event side effects.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- Успешный status command возвращает актуальные `updated_at` и строковый `revision` для cheap polling.
- `GET /events?since=<cursor>` возвращает ordered event stream по возрастанию `revision`, а `since` и `next_cursor` трактуются как opaque string cursor values.
- Empty-window и duplicate polling requests остаются duplicate-safe: read path не создает domain side effects и возвращает согласованный string `next_cursor`.
- Event payload использует поля `type`, `entity`, `entity_id`, `payload`, `revision`, `created_at`.
- Решение должно поддерживать целевой polling SLA p95 <= 10 секунд.

## Edge cases & failure modes

- Дубликаты polling-запросов не должны ломать порядок или курсор.
- Невалидный переход не должен менять состояние заказа.
- Ошибки должны использовать единый error contract с `trace_id`.
- Resume после `activated/deactivated` не должен приводить к двойным status fetch/update side effects.
- `DELAYED` заказы требуют срочного operator alert и могут быть re-claimed через `FT-004`.

## Constraints / invariants

- Event format остается стабильным для future SSE/WS.
- Cursor contract остается string-only на API boundary; consumer не должен полагаться на numeric parsing `since`/`revision`/`next_cursor`.
- `ASSIGNED` означает courier claim, не pending offer.

## Scope boundary

- `FT-005` владеет delivery progress lifecycle: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Assignment offer/claim и `CREATED|DELAYED -> ASSIGNED` принадлежат `FT-004`.
- Operator panel presentation, unassigned/delayed alert and chat redirect rules are specified in `FT-016`.
- `FT-014` may consume `FT-005` polling/events for customer UI, but MUST NOT define new delivery transition ownership or customer mutation commands.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): `/events`, event shape и error contract.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../contracts/operator-delivery-ops-contract.md): operator panel read model and command rules.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order lifecycle, transition ownership и terminal states.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../architecture/events-polling-and-bot-runtime.md): duplicate-safe runtime/polling baseline и ownership split.
- [.memory-bank/testing/index.md](../testing/index.md): quality gates и SLA-sensitive verification.
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md): customer-facing read-only status visibility over this tracking contract.

## Verification targets

- `PATCH /orders/{id}/status`
- `GET /events?since=<cursor>`
- Operator completion `DELIVERED -> COMPLETED`
- Polling SLA verify evidence ownership for `REQ-010`

## Test strategy pointers

- e2e: courier drives order to `DELIVERED`, operator closes `COMPLETED`, UI observes events.
- integration: state machine, history writes, ordered cursor polling, operator confirmation/audit.
- verify: SLA evidence on test load.

## Implementation status

- Existing `TASK-FT005-*` closure and current code may already implement the legacy v1 chain `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`, with courier-driven completion semantics. Treat that as implemented baseline behavior.
- Current target spec defines v2 lifecycle by adding `PICKED_UP` and making `DELIVERED -> COMPLETED` operator/admin-owned manual closure.
- Migration from v1 to v2 MUST be staged: preserve existing polling/event/error/history invariants, add new status support, then update UI/bot commands and validation rules.
- Existing orders in `ASSIGNED`, `IN_PROGRESS` or `DELIVERED` remain valid during rollout; do not bulk rewrite active production orders just to insert `PICKED_UP`.
- The already implemented admin panel was corrected in the FT-016 migration to show v2 status ownership and attention states rather than being rebuilt.
- `TASK-FT016-18` verified the repo-local v2 tracking flow with `PASS`: courier progression `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator/admin `DELIVERED -> COMPLETED`, ordered polling visibility for customer/admin consumers, disabled normal legacy assignment setup, and old v1 active order readability.
- Historical migration failures are retained in their task records; repaired gaps are represented by `TASK-FT016-13-FIX`, `TASK-FT016-15-FIX`, and `TASK-FT016-17-FIX`.

## Migration / rollout notes

1. Inspect current state machine, event publisher, polling endpoint and admin panel behavior before changing validation.
2. Add `PICKED_UP` and `DELAYED` support in schema/enums/read models before enabling new commands in UI/bot.
3. Keep legacy active orders readable; allow old states to render even when they skipped `PICKED_UP`.
4. Update courier commands to drive `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED` only after bot/UI affordances exist.
5. Update admin/operator panel to treat `DELIVERED` as attention-required and close it manually to `COMPLETED`.
6. Verify ordered polling, string cursor/revision semantics and duplicate-safe behavior after every state-machine change.

## Verification status

- Repo-local closure: verified by `TASK-FT016-18`.
- Required checks included `npm run test:delivery-tracking -- --runInBand`, `npm run test:order-tracking:frontend -- --runInBand`, focused admin assignment tests, checkout-payment runtime tests for paid `CREATED` source orders, `npm run lint`, `npm run build:frontend`, `git diff --check`, and changed markdown link validation.
- Real Android Telegram customer/courier smoke was not run during `TASK-FT016-18`/`TASK-FT016-19`; it remains advisory pre-release evidence unless separately requested.
