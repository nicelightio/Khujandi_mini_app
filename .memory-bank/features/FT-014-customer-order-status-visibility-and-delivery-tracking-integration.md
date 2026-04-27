---
description: Feature C4 L3 для customer-facing статуса заказа и интеграции с delivery tracking без переноса ownership операций доставки.
status: active
---
# FT-014 Customer Order Status Visibility And Delivery Tracking Integration

## REQs

- `REQ-033`
- `REQ-008`, `REQ-009`, `REQ-010`

## Ownership

- Owning slice: `delivery-tracking` for customer-facing status visibility/read integration.
- Contour: `mini-app`.
- Touched layers for future implementation: presentation + application read/polling consumer.
- Shared extraction is not justified: `FT-005` already owns polling/event semantics; customer UI consumes that contract locally.

## Current implementation state

- Already closed repo-local capability: `FT-005` owns post-assignment lifecycle, ordered polling, history/events and polling SLA.
- Already closed repo-local capability: `FT-004` owns `CREATED -> ASSIGNED`; `FT-005` owns `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Implemented repo-local capability: `TASK-FT014-02` adds a customer status entry from `FT-013` paid-order metadata. Checkout success now links to `/tracking?orderId=<id>&cursor=<revision>`, the customer status entry starts read-only at `CREATED`, and missing/lost order identity recovers to catalog instead of showing fake tracking data.
- Implemented repo-local capability: `TASK-FT014-03` wires the customer status polling consumer to `GET /events?since=<cursor>`, normalizes `next_cursor`/`entity_id`/`created_at` while preserving string-only opaque `since`/`revision` semantics, and keeps empty windows plus duplicate events stable without read-side lifecycle mutations.
- Implemented repo-local capability: `TASK-FT014-04` renders customer-safe lifecycle copy for `CREATED`, explicit waiting for assignment, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, and cancellation terminal states without exposing courier/admin controls, audit details or refund internals.
- Implemented repo-local capability: `TASK-FT014-05` hardens polling resume and stale event handling. The customer consumer uses existing shell lifecycle state for pause/resume, clears stale in-flight polling on deactivation, keeps duplicate/out-of-order revisions from double-rendering lifecycle regressions, and leaves terminal `COMPLETED`/`CANCELLED_*` states closed against later progress events.
- Implemented repo-local capability: `TASK-FT014-07` mounts authenticated customer `GET /api/v1/events?since=<cursor>` in the checked-in dev runtime, filters customer-visible events to orders owned by the current Mini App session, preserves read-only status visibility, keeps empty polling windows stable, and accepts opaque non-numeric cursor strings without leaking unrelated events or causing a runtime parse failure.
- Implemented repo-local capability: `TASK-FT014-07` aligns checkout success status handoff with the current event-stream cursor instead of `order.id`, so the first customer status polling request uses string event cursor metadata compatible with the `FT-005` polling path.
- External blocker: final customer workflow closure also remains blocked by `TASK-FT013-08` fresh real `Android Telegram` checkout evidence; `REQ-033` remains `planned` until both repo-local repair and external evidence are complete.

## Use cases

- После успешной оплаты клиент видит статус созданного заказа вместо обрыва flow на checkout success.
- Клиент видит изменения `CREATED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED` через polling without refreshing manually.
- Клиент получает controlled state if assignment/tracking events are delayed, unavailable or cancelled by operations.

## Acceptance criteria

- Customer status entry point MUST be reachable from successful `FT-013` paid order creation and tied to the created order identity.
- Customer UI MUST display at least the customer-safe order states: `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, plus controlled cancellation/terminal messaging when the order enters an operational cancellation state.
- Customer status visibility MUST consume `FT-005` event/polling contract (`GET /events?since=<cursor>`) and MUST NOT define a second delivery state machine.
- The checked-in repo-local runtime MUST mount the customer status polling route used by the frontend and prove customer/order scoping before final closure.
- Customer status visibility MUST respect `FT-005` cursor semantics: `since`, `revision` and `next_cursor` remain opaque strings.
- Status copy and UI steps MUST be customer-facing and must not expose courier/admin-only operational controls or internal audit details.
- Delayed assignment must render an explicit waiting state after paid order creation; it must not imply courier progress before `FT-004` assignment happens.
- Polling resume after Telegram WebView lifecycle changes must remain duplicate-safe and must not publish or mutate order lifecycle state.
- The feature MUST not move courier status commands, assignment, cancellation or refund ownership into the customer contour.

## Edge cases & failure modes

- Empty polling window shows stable current status and keeps the next cursor; it must not look like an error.
- Out-of-order or duplicate events are handled according to `FT-005` ordered cursor contract without double-rendering state changes.
- Lost order identity after checkout success requires controlled recovery rather than showing another user's order or a generic fake tracking page.

## Constraints / invariants

- Customer visibility is read-only for delivery lifecycle.
- `FT-014` depends on `FT-005` for event shape, state-machine semantics and SLA, but does not duplicate delivery operations ownership.
- `FT-014` may show customer-safe cancellation states, but cancellation commands and refund tracking remain with `FT-006`.

## Normative inputs

- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](FT-005-order-tracking-and-events-polling.md): tracking state machine, event polling and SLA ownership.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): upstream paid order creation and status entry point.
- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): event shape and opaque cursor contract.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order lifecycle and transition ownership matrix.
- [.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md](FT-009-mini-app-shell-and-webview-ux.md): Telegram WebView lifecycle/shell behavior used by polling UI.

## Verification targets

- Paid order success -> customer status screen.
- Customer polling through order assignment and courier progress.
- Read-only customer behavior across delayed assignment, duplicate polling and terminal states.

## Test strategy pointers

- e2e: paid order created -> status screen shows `CREATED` -> observes `ASSIGNED` and courier progress events.
- integration/frontend: duplicate and empty polling windows keep stable UI and cursor behavior.
- integration: customer UI does not expose courier/admin status mutation controls.
- verify: polling latency for visible customer status relies on the `FT-005` SLA evidence and only needs customer-consumer coverage here.
- repo-local repair evidence: `TASK-FT014-07` covers mounted `/api/v1/events`, customer/order scoping, checkout/status cursor compatibility, and opaque cursor handling; final closure remains with `TASK-FT014-06` after upstream Android checkout evidence.
