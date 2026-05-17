# Reviews runtime integration inspection

## Scope
Explorer-only inspection for `reviews-feedback` exposure and missing dev-runtime / Telegram runtime integration. No source edits made.

## Specs inspected
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`

## Code/tests inspected
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.module.ts`
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.controller.ts`
- `backend/src/slices/reviews-feedback/application/reviews-feedback.service.ts`
- `backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts`
- `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`
- `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.types.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.notifier.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
- `backend/src/dev-runtime/telegram-bot-api.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/checkout-payment-runtime.ts`
- `tests/slices/reviews-feedback/*`
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts`
- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`
- `package.json`

## Current reviews-feedback API/class exposure
- `createReviewsFeedbackModule(prisma, notifier?)` returns `{ controller, service, repository }`.
- `ReviewsFeedbackController` exposes:
  - `getOrderById(orderId)`
  - `getUserById(userId)`
  - `getReviewsByOrderId(orderId)`
  - `getActiveReviewDraft(orderId, actorUserId, direction, now)`
  - `upsertReviewDraft(input)`
  - `submitReview(input)`
- `ReviewsFeedbackService` provides:
  - `resolveReviewFlowContext(orderId, actor)` with `COMPLETED` gate and ownership/target resolution.
  - durable draft methods delegated to repository.
  - `submitReview(input)` with rating/reason validation, direction ownership, unique-pair duplicate safety, `review.created` / `review.negative` events, and one-time negative notifier fan-out only for newly created negative reviews.
- `TelegramBotReviewsFeedbackFlow` exists and is unit-tested. It supports:
  - `startFlow({ orderId, actor, revision })` -> rating prompt.
  - `handleCallback({ actor, callbackData })` -> rating/reason/skip-comment stepper.
  - `handleComment({ actor, orderId, direction, comment? })` -> submit with optional comment.
  - stale callback/revision handling and durable draft CAS via service/repository.
- `TelegramBotReviewsFeedbackHarness` exists and can build/parse `reviews-feedback:<orderId>:<direction>:<stage>:<revision>:<value>` callback data plus send rating/reason/comment prompts.
- `TelegramBotReviewsFeedbackNotifier` wraps `TelegramBotNegativeReviewAlertHarness` for low-rating admin fan-out.

## Current tests
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts` directly mounts `createReviewsFeedbackModule` and covers completed-gated reviews, duplicate-safe submit, low-rating alert fan-out, stale callbacks, durable drafts, etc.
- `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts` registers service, flow, and harness cases.
- Runtime Telegram ingress tests currently live under `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts` and cover webhook secret, courier menu, availability callback, offer claim, and courier status progression.
- There is no mounted dev-runtime reviews-feedback runtime test.

## Missing exact runtime wiring
1. `createReviewsFeedbackModule` is **not mounted** in `createDevApiRuntime`.
   - `dev-api-runtime.ts` creates admin, catalog, checkout-payment, delivery-assignment, delivery-tracking, order-cancellation modules only.
   - `routeContext` has no `reviewsFeedbackModule` and `startDevApiServer()` does not return one.

2. No dev-runtime `ReviewsFeedbackPrismaProvider` adapter exists.
   - `createReviewsFeedbackModule` needs `order`, `user`, `review`, `reviewDraft`, `event`, `$transaction` client methods.
   - Existing runtime state has orders/users in `checkoutPaymentState`, operational events in `OperationalRuntimeState`, but no runtime `reviews` or `reviewDrafts` store.
   - `order-ops-runtime.ts` currently uses `PrismaReviewsFeedbackStaffMetricsReader` with `review.findMany: async () => []`, so Staff metrics cannot see runtime-created reviews.

3. Negative review notifier is not mounted in dev runtime.
   - `TelegramBotReviewsFeedbackNotifier` exists, but `createReviewsFeedbackModule` is never passed one.
   - Runtime should pass `new TelegramBotReviewsFeedbackNotifier(new TelegramBotNegativeReviewAlertHarness(telegramDispatcher))` so `rating <= 2` alerts active admins through existing dispatcher/dedupe path.

4. Review flow is not injected into `createTelegramBotRuntime`.
   - `telegram-bot-runtime.ts` constructor input has only `deliveryAssignmentModule`, `deliveryTrackingModule`, `dispatcher`, `callbackResponder`.
   - It does not import/use `TelegramBotReviewsFeedbackFlow` or parse review callbacks.

5. Telegram callback handling currently resolves every callback actor as an active courier before parsing intent.
   - Lines around `telegram-bot-runtime.ts` callback handling call `resolveCourierByTelegramId(telegramId)` before checking callback type.
   - Client review callbacks would fail with `COURIER_NOT_FOUND` before `reviews-feedback` parsing.
   - Review callback handling must parse `reviews-feedback:*` before courier-only callback resolution, or use role-aware actor resolution.

6. Telegram message handling currently only recognizes `/start`/`Курьер` courier menu.
   - Review comment messages are ignored.
   - `TelegramBotReviewsFeedbackFlow.handleComment` requires `{ actor, orderId, direction, comment }`, but a plain Telegram text message lacks `orderId/direction` unless runtime can locate the active comment draft or the prompt instructs an encoded command/reply format.
   - Minimal durable option likely needs a repository/service method to find the actor's active `comment` draft by Telegram actor, or a narrow runtime-only adapter helper over runtime draft store.

7. After `COMPLETED`, runtime does not prompt client/courier.
   - `admin-order-operations.routes.ts` operator status route returns the `recordOperatorStatusTransition` result directly.
   - There is no hook after `DELIVERED -> COMPLETED` to start two review flows.
   - Delivery tracking notifier only sends status-change notifications; it does not start review prompts.

8. Runtime return/test surface does not expose review module.
   - `DevApiRouteContext` lacks `reviewsFeedbackModule` and possibly `telegramReviewFlow`.
   - `startDevApiServer()` return shape lacks `reviewsFeedbackModule`, making focused runtime assertions harder unless tests inspect messages and public state only.

## Suggested minimal edit set
- `backend/src/dev-runtime/order-ops-runtime.ts`
  - Add runtime review/reviewDraft stores and counters in operational runtime state or return a `createRuntimeReviewsFeedbackPrisma(...)` provider.
  - Wire `review.findMany/findUnique/create`, `reviewDraft.findUnique/updateMany/upsert`, `event.create/findFirst`, `user.findUnique/findMany`, `order.findUnique`, `$transaction` over existing `checkoutPaymentState` + `runtimeState.events`.
  - Replace Staff metrics `review.findMany: []` with the same runtime review store.
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
  - Import `createReviewsFeedbackModule`, review flow/harness/notifier.
  - Instantiate reviews module with runtime provider and Telegram negative-alert notifier.
  - Instantiate `TelegramBotReviewsFeedbackFlow` with reason codes.
  - Pass `reviewsFeedbackModule` and `reviewsFeedbackFlow` into route context / Telegram runtime.
- `backend/src/dev-runtime/dev-api-server.types.ts`
  - Add `reviewsFeedbackModule` and optionally `telegramReviewsFeedbackFlow` to `DevApiRouteContext`.
- `backend/src/dev-runtime/dev-api-server.ts`
  - Return `reviewsFeedbackModule` for tests.
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
  - Add optional/required `reviewsFeedbackModule` or review actor resolver and `reviewsFeedbackFlow` input.
  - Parse `reviews-feedback:*` callback before courier-only callback parsing.
  - Resolve actor by Telegram id as either active client or courier depending on payload direction (`client_to_courier` -> client, `courier_to_client` -> courier).
  - Route callback result actions e.g. `review_prompt`, `review_submitted`, `review_ignored`; answer callback safely.
  - Route text messages during active comment draft to `flow.handleComment`.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
  - After successful operator status transition, if `result.status === "COMPLETED"`, fetch reviews-feedback order and call `startFlow` for client and courier (if `courierId` exists), using transition `revision`.
  - Keep prompt failures transport-only/non-blocking so completed status write response is not rolled back.
- Optional if message comments cannot be solved without broadened repo API:
  - Add `findActiveCommentDraftByActor(actorUserId, now)` to `reviews-feedback` service/repository/types, or use a runtime-only adapter helper to locate the single active `comment` draft for that Telegram actor.

## Suggested minimal tests
- Add `tests/slices/reviews-feedback/reviews-feedback.runtime.spec.ts`, or extend `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts` only if keeping all Telegram runtime ingress together.
- Scenario: `completed order -> courier review -> client review -> duplicate safe`.
  - Start dev runtime with fake `telegramMessageDispatcher` collecting messages.
  - Create/login admin, ensure client+courier users with Telegram ids, put order in `DELIVERED` assigned to courier.
  - POST admin status `COMPLETED`; assert two rating prompts are sent to client and courier Telegram ids with `reviews-feedback:*` callback data.
  - Courier callback sequence rating -> reason -> skip comment through `/api/v1/telegram/webhook`; assert one review persisted with `source: telegram_bot` and `action` submitted.
  - Client callback sequence rating -> reason -> skip/comment; assert second review persisted.
  - Replay final skip/submit callback for one side; assert review count remains 2 and negative alert count/dedupe does not repeat.
  - Include at least one low rating to prove `review.negative` admin alert fan-out in mounted runtime.
- Useful existing command: `npm run test:reviews-feedback` covers slice tests; focused runtime test can be run directly with `jest --config jest.config.cjs tests/slices/reviews-feedback/reviews-feedback.runtime.spec.ts` unless package script is added.

## Risks / decisions for orchestrator
- Message comments need a small product/contract decision: either support plain reply text by finding the actor's active comment draft, or constrain runtime comment submission to an encoded command/reply context. The current flow API assumes order/direction are supplied by caller; Telegram raw message does not supply them.
- Hooking prompts in the admin status route is the smallest integration, but a more semantic location would be a delivery-tracking post-transition notification/listener. For narrow task scope, route-level post-success hook is likely sufficient.
