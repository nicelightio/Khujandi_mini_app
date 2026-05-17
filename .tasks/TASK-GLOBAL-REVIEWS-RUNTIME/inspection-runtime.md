# Inspection: dev-runtime / telegram-bot-runtime review prompt integration points

## Scope inspected

Specs primed:
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`

Code/tests inspected around checkout, assignment, tracking, completion, Telegram polling/webhook and reviews.

## Focused file map

### Runtime composition / route mounting
- `backend/src/dev-runtime/dev-api-server.ts`
  - Route order: health/test routes -> `handleTelegramBotRoutes` -> `handleMiniAppRoutes` -> catalog/staff/admin order routes.
  - Starts polling only when `options.telegramBotPollingEnabled === true && runtime.isTelegramBotApiEnabled`.
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
  - Creates checkout/catalog/admin modules, operational delivery modules, Telegram API client, Telegram dispatcher, Telegram bot runtime.
  - `createTelegramBotRuntime` currently receives only `deliveryAssignmentModule`, `deliveryTrackingModule`, dispatcher, callback responder.
  - No `reviews-feedback` module or review flow is composed into current dev-runtime.
- `scripts/dev-api.ts`
  - Maps env to runtime options: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_POLLING`, `TELEGRAM_WEBHOOK_SECRET`, staging/test flags.

### Checkout / paid order creation / customer polling
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
  - `POST /api/v1/auth/telegram` authenticates Mini App and sets cookie.
  - `GET /api/v1/orders/checkout/bootstrap` exposes mock/test availability metadata.
  - `POST /api/v1/orders/checkout` validates session + composition, requires enabled payment provider, calls `checkoutPaymentModule.controller.checkoutOrder`, returns `orderId`, `status`, `paymentStatus`, `updated_at`, `revision` from `operationalModules.getCurrentEventCursor()`.
  - `GET /api/v1/events?since=<cursor>` filters delivery-tracking events by current customer’s order ids.
- `backend/src/dev-runtime/checkout-payment-runtime.ts`
  - In-memory checkout state backing orders/users/sessions.

### Assignment / offer / claim / operator runtime
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
  - `GET /api/v1/admin/operator/delivery/orders` operator read model.
  - `POST /api/v1/admin/orders/:orderId/assignment-offers` manual offer.
  - `POST /api/v1/admin/orders/:orderId/auto-offers` broadcast offer.
  - `POST /api/v1/admin/operator/delivery/offer-timeouts/tick` timeout evaluator.
  - `POST /api/v1/admin/orders/:orderId/assignment` returns `410 LEGACY_ASSIGNMENT_DISABLED`.
  - `POST /api/v1/admin/orders/:orderId/assignment-override` explicit override.
  - `POST /api/v1/admin/operator/delivery/orders/:orderId/status` operator/admin lifecycle control including `DELIVERED -> COMPLETED`.
- `backend/src/dev-runtime/order-ops-runtime.ts`
  - `createOperationalRuntimeModules()` wires `delivery-assignment`, `delivery-tracking`, `order-cancellation` over shared checkout runtime state.
  - `deliveryAssignmentClient.event.create` and `deliveryTrackingClient.event.create` append runtime events.
  - `getCurrentEventCursor()` returns `(nextEventId - 1n).toString()`.
  - Staff metrics currently use a stub `reviewsFeedbackStaffMetricsReader` with empty review data.

### Telegram runtime / webhook / polling
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
  - `POST /api/v1/telegram/webhook` accepts Telegram update JSON.
  - Checks `x-telegram-bot-api-secret-token` against configured `TELEGRAM_WEBHOOK_SECRET`.
  - If secret absent, rejects in production or whenever real Telegram API is enabled.
  - Delegates to `context.telegramBotRuntime.handleUpdate(body)`.
- `backend/src/dev-runtime/telegram-bot-api.ts`
  - Real Bot API client if token matches `/^\d+:[A-Za-z0-9_-]+$/`.
  - `sendMessage` supports inline buttons via `reply_markup.inline_keyboard[*].callback_data`.
  - `getUpdates` polls allowed updates `message`, `callback_query`.
  - In-memory `sentDedupeKeys` prevents duplicate outbound sends per process.
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
  - Handles courier menu messages (`/start`, `Курьер`, `курьер`).
  - Handles callback_query for courier availability, courier claim, delivery tracking status actions.
  - Resolves actor by `callback_query.from.id` / `message.from.id` through `deliveryAssignmentModule.controller.getCourierStaffByTelegramUserId` and requires active courier.
  - Does not parse review callbacks/messages today.

### Delivery tracking / completion path
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
  - Courier path: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`; notifies courier after committed transition with next action buttons.
  - Operator path: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`; `recordOperatorStatusTransition` persists status/history/event and returns result.
  - Important gap for reviews: no post-commit notifier/hook is called from `recordOperatorStatusTransition`; `COMPLETED` currently only writes lifecycle artifacts.
- `backend/src/slices/delivery-tracking/presentation/delivery-tracking.controller.ts`
  - Exposes `recordOperatorStatusTransition` used by admin route.
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.notifier.ts`
  - Only courier status-action prompts. No completion/review prompt responsibility.

### Existing reviews runtime building blocks
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.module.ts`
  - Factory for `ReviewsFeedbackService` + repository + controller, optional notifier.
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.controller.ts`
  - `getOrderById`, `getUserById`, `getReviewsByOrderId`, `getActiveReviewDraft`, `upsertReviewDraft`, `submitReview`.
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
  - Builds/parses review stepper callbacks and outbound prompt buttons.
  - Also has negative alert fan-out harness.
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
  - Full bot-guided flow object: `startFlow`, `handleCallback`, `handleComment`.
  - Supports rating -> reason_code -> comment/skip, durable drafts via service, revision-aware stale callback handling, duplicate submitted draft handling.
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.notifier.ts`
  - Negative review notifier wrapper.

## Existing callback formats

Courier availability:
- Builder/parser: `telegram-bot-courier-availability.harness.ts`
- Runtime parser: `parseCourierAvailabilityCallbackData(...)`
- Buttons produced in `telegram-bot-runtime.ts` courier menu.
- Exact prefix not fully re-read in this pass, but current runtime recognizes types:
  - `start_work`
  - `stop_after_5_minutes`
  - `set_auto_offer` with `enabled`
  - includes `courierId`; runtime rejects actor mismatch.

Courier claim:
- Builder/parser: `telegram-bot-delivery-assignment-claim.harness.ts`
- Format: `delivery-assignment-courier-claim:<encodeURIComponent(offerId)>:<encodeURIComponent(courierId)>`
- Runtime action: `courier_claim`; validates callback courier id equals resolved active courier id, then calls `deliveryAssignmentModule.controller.claimOffer({ offerId, courierId })`.

Courier status progression:
- Builder/parser: `telegram-bot-delivery-tracking.harness.ts`
- Format: `delivery-tracking:<orderId>:<nextStatus>`
- Allowed `nextStatus`: `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.
- Runtime action: `courier_status`; actor is resolved active courier; calls `deliveryTrackingModule.controller.recordStatusTransition`.
- No `COMPLETED` courier callback by design.

Review stepper:
- Builder/parser exists but is not wired into `dev-runtime/telegram-bot-runtime.ts`.
- Format: `reviews-feedback:<orderId>:<direction>:<stage>:<encodeURIComponent(revision)>:<encodeURIComponent(value)>`
- `direction`: `client_to_courier` or `courier_to_client`.
- `stage`: `rating`, `reason_code`, `skip_comment`.
- `value`: rating/reason code/`SKIP`.
- The flow also expects free-text comment handling through `handleComment({ actor, orderId, direction, comment })`; there is no current Telegram message parser in dev runtime to identify which order/direction a comment belongs to.

## Completion hook / event path for triggering review prompts

Current actual path to `COMPLETED` in runtime:
1. Admin/operator HTTP route: `POST /api/v1/admin/operator/delivery/orders/:orderId/status`.
2. Route calls `operationalModules.deliveryTrackingModule.controller.recordOperatorStatusTransition({ orderId, nextStatus, actor })`.
3. Controller calls `DeliveryTrackingService.recordOperatorStatusTransition`.
4. Service validates operator role and adjacent transition (`DELIVERED -> COMPLETED`), then calls repository `recordStatusTransition`.
5. Runtime repository updates `checkoutPaymentState.orders[].status`, writes runtime status history, writes `order.status_changed` event.
6. Route returns `{ orderId, status: "COMPLETED", updatedAt, revision }`.

Best places to trigger review prompts after `COMPLETED`:
- Narrow integration hook after step 4/5 returns in `DeliveryTrackingService.recordOperatorStatusTransition` when `artifacts.order.status === "COMPLETED"`; add a separate optional notifier/interface so delivery-tracking remains lifecycle owner but can notify a review-prompt adapter after commit. This mirrors existing courier status notifier but for completion.
- Alternative runtime-only hook after route receives result in `admin-order-operations.routes.ts` would be cheaper but less slice-clean and misses non-HTTP operator completion callers.
- Event-consumer style hook is not currently present; events are in-memory in runtime, no worker/queue per MVP constraints.

Data needed to start both review prompts:
- Order id and revision from completion event/result.
- Client user id and courier user id from order record.
- Telegram ids for client/courier. `reviews-feedback` service can resolve flow context from actor + order; actors must be constructed with roles `client`/`courier`.
- Current dev-runtime does not compose `reviews-feedback` over the shared checkout/order state, so this is the main wiring gap.

## Gaps / drift relevant to global reviews runtime

- Existing review bot flow is implemented as library/integration code but not mounted in `createDevApiRuntime` or `createTelegramBotRuntime`.
- `TelegramBotRuntime` resolves every callback actor as an active courier before trying action-specific parsers. This will reject client review callbacks immediately unless review callbacks are parsed before courier-only resolution or actor resolution becomes action-specific.
- No inbound free-text review comment routing exists. `TelegramBotApiUpdate.message.text` currently only opens courier menu for `/start`/`Курьер`; all other messages are ignored.
- No review prompt is triggered from `COMPLETED`. Operator completion only writes status/history/event.
- Dev-runtime has no `reviews-feedback` Prisma/runtime adapter over `checkoutPaymentState`/runtime events/review drafts. Tests currently instantiate reviews module with mocks, not mounted server state.
- Negative review alert notifier exists, but dev-runtime does not wire `ReviewsFeedbackNotifier` to `TelegramBotNegativeReviewAlertHarness`.

## Focused tests to extend/add

Primary runtime ingress tests:
- Extend `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts` or create `tests/slices/reviews-feedback/telegram-bot-runtime.spec.ts`:
  - After operator completes a delivered order, assert two review rating prompts are sent: client -> courier and courier -> client.
  - Client callback `reviews-feedback:...:rating:...` must not require active courier resolution.
  - Courier callback still resolves courier identity and direction correctly.
  - Review `reason_code`, `skip_comment`, and free-text comment messages submit via reviews service.
  - Duplicate callback/update does not create duplicate review or duplicate negative alert.
  - Stale callback returns ignored outcome and does not mutate draft.

Completion hook tests:
- Extend `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`:
  - `DELIVERED -> COMPLETED` emits review prompt hook/outbound messages after lifecycle commit.
  - Invalid `PICKED_UP -> COMPLETED` remains `409` and sends no prompts.
  - If prompt transport fails, status completion remains committed.

Reviews module/runtime tests:
- Add mounted dev-runtime coverage under `tests/slices/reviews-feedback/*runtime*.spec.ts` once module is composed:
  - completed-only activation gate through actual shared runtime order state.
  - client/courier identity lookup by Telegram id for inbound updates.
  - negative alert fan-out via `TelegramBotReviewsFeedbackNotifier`.

Existing unit/integration tests to keep/extend:
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts` already covers service/module flow with mocked Prisma; extend only if new repository/runtime adapter behavior is introduced.
- `tests/slices/reviews-feedback/reviews-feedback.harness.cases.ts` / `reviews-feedback.flow.cases.ts` likely cover callback shape/stepper logic; reuse for parser expectations.
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts` currently covers webhook secret, courier menu, claim, courier status callbacks; it is the closest mounted Telegram ingress precedent.

## Recommended implementation boundary for parent agent

- Owning slice for prompt trigger remains `reviews-feedback`; trigger is initiated by delivery lifecycle completion but should call a narrow completion-review-prompt notifier/adapter rather than embedding review business rules into delivery tracking.
- Owning contour for inbound/outbound bot parsing is `telegram-bot` presentation/runtime.
- Avoid broad shared extraction. Add action-specific parsing/actor resolution in Telegram runtime, plus a slice-local reviews runtime adapter.
