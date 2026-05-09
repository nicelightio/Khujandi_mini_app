---
description: Feature C4 L3 для courier assignment offers, atomic claim и assignment notification.
status: active
---
# FT-004 Courier Assignment

## REQs

- `REQ-007`, `REQ-036`, `REQ-018`

## Use cases

- Operator/admin вручную предлагает заказ конкретному курьеру.
- Auto-offer предлагает новый заказ всем активным свободным курьерам, если настройка включена.
- Курьер подтверждает принятие заказа через Telegram-бота.
- Первый successful claim закрепляет заказ за курьером.

## Acceptance criteria

- `ASSIGNED` ставится только после successful courier claim; pending manual offer или broadcast offer не меняет order status на `ASSIGNED`.
- Manual offer доступен `operator` и `admin`; любой `admin` может выполнять роль operator.
- Auto-offer по умолчанию выключен и включается в настройках operator panel.
- Auto-offer fan-out идет только активным свободным курьерам.
- Claim выполняется atomic проверкой: order still active, `courier_id` пустой, status `CREATED|DELAYED`, courier active/free.
- Первый successful claim пишет `courier_id`, `assigned_at`, `order_status_history`, событие `order.assigned` и command-response с `updated_at`/string `revision`.
- Concurrent losers получают controlled already-taken outcome без history/event side effects.
- Если offer не принят за 3 минуты, отправляется repeat notification; если еще через 3 минуты не принят, заказ получает/сохраняет `DELAYED`, operators получают срочный alert.
- Для персонального offer courier `rating_score` уменьшается на 1 после second timeout; для broadcast offer без конкретного courier штраф не применяется.
- Assignment write flow использует единый error contract и audit trail.

## Scope boundary

- `FT-004` владеет assignment offer/claim semantics and `CREATED|DELAYED -> ASSIGNED`.
- `FT-016` владеет operator panel settings/alert UX and courier menu UX, но не подменяет atomic assignment rules.
- Дальнейший delivery lifecycle после `ASSIGNED` принадлежит `FT-005`.

## Edge cases & failure modes

- Нельзя claim-нуть заказ, если courier inactive, already busy или order уже закреплен.
- Повторный claim одного заказа после successful claim duplicate-safe и не создает второй assignment.
- Telegram retry/duplicate callback не должен создавать повторный assignment.
- Если transport notification failed, order status не должен ложно становиться `ASSIGNED`.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): event shape, string `revision` contract и единый error shape.
- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): courier offer/claim и bot menu behavior.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../contracts/operator-delivery-ops-contract.md): operator panel read/command boundaries.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): ownership `CREATED|DELAYED -> ASSIGNED`.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для assignment flow.

## Test strategy pointers

- integration: atomic claim race, exactly one courier wins.
- e2e: manual operator offer requires courier confirmation before `ASSIGNED`.
- bot: duplicate callback/Telegram retry does not create duplicate assignment.
- timer: 3+3 minute timeout path sets `DELAYED`, alerts operators and adjusts rating for personal offer.

## Implementation status

- Existing `TASK-FT004-*` closure and current code may already implement legacy v1 admin direct assignment (`CREATED -> ASSIGNED`). Treat that as an implemented baseline, not as invalid history.
- Current target spec defines v2 behavior: assignment is offer + courier claim; pending offer does not set `ASSIGNED`; successful claim publishes `order.assigned`.
- Migration from v1 to v2 MUST be additive-first and staged: keep existing `orders.courier_id`, `orders.status`, `assigned_at`, audit/history/event guarantees, then add `assignment_offers` and claim semantics without breaking existing orders.
- During transition, legacy direct assignment may remain as an explicit admin/operator override only if it is named and guarded as override behavior; normal manual assignment must create a targeted offer requiring courier confirmation.
- New implementation work should be planned under `FT-016`/migration tasks and must include compatibility checks against the already implemented admin panel and delivery code.

## Migration / rollout notes

1. Inspect current code before implementation tasks and record drift between v1 implementation and this v2 spec.
2. Add persistence/API support for offers and courier availability without removing legacy order assignment fields.
3. Keep existing active orders valid; do not mass-convert in-flight `ASSIGNED` orders into offer state.
4. Switch manual assignment UI from direct assignment to targeted offer only after bot claim and atomic server claim are ready.
5. Change `order.assigned` publication point for the normal v2 path to successful claim; keep any legacy direct-assignment event semantics isolated behind an override path until removed.
6. Verify duplicate Telegram callbacks and concurrent claims before enabling broadcast auto-offer.
