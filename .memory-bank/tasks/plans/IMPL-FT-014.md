---
description: Implementation plan for FT-014 customer order status visibility and delivery tracking integration.
status: active
---
# IMPL-FT-014 Customer Order Status Visibility And Delivery Tracking Integration

## Goals

- Give the customer a status surface immediately after successful `FT-013` paid order creation.
- Tie the status surface to the real created order identity and customer-safe metadata.
- Consume the existing `FT-005` ordered polling/event contract without defining a second delivery state machine.
- Render `CREATED`, delayed assignment, courier progress, completed and customer-safe cancellation/terminal states.
- Keep customer behavior read-only and free of courier/admin controls.

## Source Artifacts

- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`

## Normative Inputs

- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Ownership And Boundaries

- Owning slice: `delivery-tracking` for customer-facing read/status visibility.
- Contour: `mini-app`.
- Touched layers: presentation and application read/polling consumer.
- `checkout-payment` remains the owner of paid order creation and status-entry metadata from `FT-013`.
- `delivery-assignment`, `delivery-tracking`, and `order-cancellation` retain transition command ownership for assignment, courier progress and cancellation/refund semantics.
- Shared extraction is not justified; the customer status UI consumes the `api-events-baseline` contract and `FT-005` state semantics locally.

## Steps

1. Freeze the execution boundary for customer status visibility and confirm required order identity/cursor metadata from `FT-013`.
2. Add a customer status entry surface reachable only from a real paid order identity, with controlled recovery for missing/lost identity.
3. Wire the `GET /events?since=<cursor>` consumer using opaque string cursor semantics and empty-window stability.
4. Render customer-safe lifecycle steps for `CREATED`, waiting for assignment, assigned/courier progress, completed and cancelled terminal states.
5. Harden duplicate/out-of-order event handling and polling resume after Telegram WebView lifecycle changes without lifecycle mutations.
6. Repair checked-in repo-local runtime integration by mounting the customer `GET /api/v1/events?since=<cursor>` path and aligning checkout/status cursor semantics before final closure. Completed by `TASK-FT014-07`.
7. Run final cross-slice e2e verification and sync RTM/docs after repo-local polling repair; Android checkout/status smoke remains an advisory pre-release check, not a final-sync blocker.

## Expected Touched Files

- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-014.md`
- `.memory-bank/tasks/plans/index.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/changelog.md`
- `.memory-bank/index.md`
- `frontend/src/slices/delivery-tracking/**/*` or existing customer tracking/status slice files
- `frontend/src/slices/checkout-payment/**/*` only for consuming the existing status-entry handoff if unavoidable
- `frontend/src/shared/**/*` only for existing shell/polling primitives already owned by shared runtime/UI
- `frontend/src/tests/slices/delivery-tracking/**/*`
- `frontend/src/tests/slices/checkout-payment/**/*` only for handoff smoke coverage
- `tests/slices/delivery-tracking/**/*` only if mounted/runtime polling contract coverage needs backend fixtures

## Tests

- Frontend route/page smoke: paid-order success metadata opens the status screen for the same order identity.
- Frontend integration: missing/lost order identity shows controlled recovery and never displays fake/other-user tracking data.
- Polling consumer coverage: empty windows keep stable UI and `next_cursor`; duplicate events do not double-render state changes; cursor/revision values remain opaque strings.
- Customer UI coverage: status steps render `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED` and customer-safe cancellation terminal copy without courier/admin controls.
- Resume coverage: Telegram `activated/deactivated` or app resume restarts polling duplicate-safely and does not publish lifecycle events.
- E2E/customer flow: catalog/cart -> checkout -> paid order `CREATED` -> status screen -> observes assignment and courier progress through `COMPLETED`.

## Quality Gates

- `lint` / `typecheck` for touched frontend/backend packages.
- Focused frontend tests for `delivery-tracking` customer status UI and polling consumer behavior.
- Relevant checkout handoff smoke coverage proving status entry is tied to paid-order output.
- Cross-slice e2e or integration route smoke for paid order -> customer status -> ordered polling updates.
- Mounted runtime coverage for the checked-in `/api/v1/events` customer polling route, including customer/order scoping and negative unrelated-order visibility checks.
- Cursor compatibility coverage proving checkout success metadata can seed status polling while `since`/`revision`/`next_cursor` remain opaque string API values.
- Telegram WebView-sensitive verification notes when lifecycle/resume or shell-bottom-action behavior is touched.

## UAT Steps

1. Complete catalog/cart checkout and successful payment, then verify the app opens or offers a clear link to the created order status screen.
2. Confirm the initial state is `CREATED` or explicit waiting-for-assignment copy, not courier progress before assignment.
3. Assign courier and drive courier statuses through `IN_PROGRESS`, `DELIVERED` and `COMPLETED`; verify customer UI updates through polling without manual refresh.
4. Poll with no new events and confirm the screen remains stable instead of showing an error.
5. Resume the Mini App after backgrounding and confirm polling continues without duplicated visible transitions.
6. Cancel an eligible order through operational flow and verify customer-safe terminal cancellation copy without refund/admin internals.

## Verification Targets

- Paid order success -> customer status screen.
- Ordered customer polling through assignment and courier progress.
- Read-only customer behavior across delayed assignment, duplicate polling, lifecycle resume and terminal states.
- `REQ-033` RTM closure requires repo-local evidence that customer status visibility consumes `FT-005` contract through the real paid-order flow; fresh Android Telegram smoke is advisory pre-release evidence, not a blocking repo-local gate.
- `TASK-FT014-07` has passed for repo-local mounted `/api/v1/events` and compatible checkout cursor evidence; `TASK-FT014-06` is unblocked for docs/evidence closure without upstream Android checkout evidence.
