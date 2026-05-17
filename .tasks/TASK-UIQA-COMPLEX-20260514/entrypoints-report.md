---
description: Entry points report for complex UI QA flow on 2026-05-14.
status: active
---
# TASK-UIQA-COMPLEX-20260514 Entrypoints Report

## Result

Read-only exploration completed.

Target flow spans these slices and contours:

- `checkout-payment`, contour `mini-app`: client fixed-persona session, cart/composition handoff, mock paid checkout, customer event polling.
- `delivery-assignment`, contour `admin-web` + `telegram-bot`: manual/broadcast offer creation, courier availability, courier claim.
- `delivery-tracking`, contour `telegram-bot` + `admin-web` + `mini-app`: courier status progression, operator/admin `DELIVERED -> COMPLETED`, customer polling visibility.
- `reviews-feedback`, contour `telegram-bot`: client and courier review stepper plus negative alert fan-out.
- `admin-access`, contour `admin-web`: fixed admin/boss session and protected operator routes.
- Runtime/testing `FT-018`: guarded staging reset/seed/fixed-persona session harness.

No `shared` extraction is involved. This is test orchestration only; no product/runtime code should be changed by the QA agent unless a separate implementer task is approved.

## Available runtime setup

Staging/local QA should use the existing FT-018 harness:

- `GET /api/v1/health`
- `POST /api/v1/test/reset` with `{ "scope": "all" }`
- `POST /api/v1/test/seed` with scenario
- `GET /api/v1/test/personas`
- `POST /api/v1/test/session` with persona

Relevant seed scenarios:

- `checkout_happy`: prepares catalog/shop/customer for client checkout.
- `operator_orders`: prepares seeded operational orders including `test-order-created-1001`, `test-order-delivered-2001`, `test-order-cancellable-3001`.
- `delivery_happy_path`: same operational seed path as `operator_orders` today.

Supported fixed personas from code:

- `client_alina`: `mini-app`, role `client`, HttpOnly Mini App cookie session.
- `seller_plov`: `mini-app`, role `seller`, HttpOnly Mini App cookie session.
- `admin_boss`: `admin-web`, role `admin` metadata but backed by `boss@example.com`, HttpOnly admin access/refresh cookies.
- `courier_7`: `telegram-bot`, role `courier`, test metadata only, not a browser cookie session.

Important limitation: `courier_7` session is `testMetadata`, so browser `ui_qa` cannot act as courier through a mounted courier web UI. Courier actions must be driven either through Telegram bot runtime if deployed, a test/internal service harness, or manually by the human in the real bot.

## Concrete UI/API entrypoints

### Client paid order

UI:

- `/`
- `/shops`
- `/shops/:publicPath`
- `/checkout`
- `/tracking?orderId=<orderId>&cursor=<revision>`

API/runtime:

- `GET /api/v1/orders/checkout/bootstrap`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/events?since=<cursor>`

The browser fixture can inject the known `checkout_happy` composition into `sessionStorage` key `khujandi.customer_order_composition` and submit `/checkout` with the fixed `client_alina` HttpOnly cookie. Existing fixture covers this as `browser-smoke`.

### Admin/operator panel and assignment

UI:

- `/admin`
- `/admin/login`
- `/admin/orders/assignment`

API/runtime:

- `GET /api/v1/admin/operator/delivery/orders`
- `POST /api/v1/admin/orders/:orderId/assignment-offers` with `{ "courierId": "courier-7" }`
- `POST /api/v1/admin/orders/:orderId/auto-offers`
- `POST /api/v1/admin/operator/delivery/orders/:orderId/status` with `{ "nextStatus": "COMPLETED" }`

Direct legacy assignment is intentionally disabled:

- `POST /api/v1/admin/orders/:orderId/assignment` returns `410 LEGACY_ASSIGNMENT_DISABLED`.

There is an explicit override route:

- `POST /api/v1/admin/orders/:orderId/assignment-override`

For normative QA, prefer offer + courier claim, not override.

### Courier active/login and claim

Available code boundary:

- Courier persona: `POST /api/v1/test/session` with `{ "persona": "courier_7" }` creates/ensures courier user, but returns test metadata only.
- Courier availability callbacks are represented by `telegram-bot-courier-availability.harness.ts`.
- Claim callbacks are represented by `telegram-bot-delivery-assignment-claim.harness.ts`.

No mounted staging HTTP route was found for:

- courier start work / active toggle;
- courier auto-offer ON/OFF;
- courier claim callback execution.

Known internal/service entrypoints from tests:

- `operationalModules.deliveryAssignmentModule.service.startCourierWork("courier-7")`
- `operationalModules.deliveryAssignmentModule.service.setCourierAutoOfferParticipation("courier-7", true)`
- `operationalModules.deliveryAssignmentModule.controller.claimOffer({ offerId, courierId: "courier-7" })`

This means a full browser-only `ui_qa` run cannot complete the courier claim step unless it delegates that step to a test harness/script or a real bot/manual courier action.

### Courier status progression

Allowed courier lifecycle:

- `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`

Available code boundary:

- `delivery-tracking` service `recordStatusTransition(...)` for actor role `courier`.
- Telegram callback format from harness: `delivery-tracking:<orderId>:<PICKED_UP|IN_PROGRESS|DELIVERED>`.

No mounted staging HTTP route was found for courier status callbacks. Admin/operator status route exists, but it uses operator-controlled path and can also move `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`. For this requested test, using admin route for the first three courier statuses would not prove courier-owned behavior.

### Admin/operator completion

Available:

- UI `/admin/orders/assignment` status action when order is `DELIVERED`.
- API `POST /api/v1/admin/operator/delivery/orders/:orderId/status` with `{ "nextStatus": "COMPLETED" }`.

This is the correct mounted runtime entrypoint for step 5.

### Reviews

Spec says both reviews happen through Telegram bot after `COMPLETED`.

Available code boundary:

- `TelegramBotReviewsFeedbackHarness`
- `TelegramBotReviewsFeedbackFlow`
- callback format: `reviews-feedback:<orderId>:<client_to_courier|courier_to_client>:<rating|reason_code|skip_comment>:<revision>:<value>`

No mounted staging HTTP route was found for review callbacks or a browser review UI. Full review proof therefore requires bot runtime/manual bot interaction or an internal review-flow test harness/script.

## Best smooth-flow preparation

Recommended orchestration shape before running UI QA:

1. Use public or local staging with `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`.
2. Load `E2E_TEST_TOKEN` from ignored env; never print it.
3. Run a preflight fixture:
   - `UI_QA_SCENARIO=checkout_happy UI_QA_PERSONA=client_alina node tests/e2e/staging-ui-qa-fixture.mjs api-smoke`
4. Start browser UI QA with `client_alina` and create a fresh paid order through `/checkout`; capture `orderId` and `revision`.
5. Bootstrap `admin_boss` session and open `/admin/orders/assignment`; verify the fresh order appears unassigned.
6. Create manual offer to `courier-7` through admin UI/API.
7. Blocker point: courier must claim through one of:
   - real Telegram bot/manual human action, if deployed and wired to staging;
   - a small test harness/script that calls internal service boundary;
   - temporary staging-only HTTP test route, but this would be implementation work and should be approved separately.
8. After claim, use courier-owned status path through bot/manual/harness for `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.
9. Use admin UI/API to close `COMPLETED`.
10. Blocker point: run client and courier reviews through bot/manual/harness, because browser UI routes are not mounted for reviews.
11. Verify customer `/tracking` and admin panel history/polling after each major status.

## Blockers / risks

- Browser-only `ui_qa` cannot truthfully complete courier active/login, courier claim, courier status progression, or both review submissions with the currently found mounted routes.
- `courier_7` fixed persona does not produce a browser session; it is only `testMetadata`.
- The operational seed `operator_orders` is useful for panel/status smoke, but the requested flow starts with a client-created paid order. A smooth full flow needs either dynamic order capture from checkout or a dedicated orchestration harness.
- Reviews are implemented as bot flow/harness and service tests, not as mounted staging browser routes.
- UI QA does not prove Telegram HMAC/replay/WebView or real payment-provider trust boundaries.
- Worktree is already dirty with unrelated changes; this exploration did not modify those files.

## Recommendation

For the orchestrator: do not start the complex full-flow browser QA until the courier/review execution mechanism is chosen.

Fastest reliable path:

- Let `ui_qa` cover client checkout, admin panel assignment UI, admin completion UI, and customer tracking.
- Use a narrow tester script/subagent for internal courier and review harness execution, writing sanitized evidence under this task.
- If the human wants to act as courier manually, first verify that the real staging Telegram bot is deployed and wired to the same staging runtime/state; otherwise manual courier actions in Telegram will not affect the browser staging order.

## Files inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/index.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/index.md`
- `.memory-bank/states/index.md`
- `.memory-bank/runbooks/index.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-courier-availability.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment-claim.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `frontend/src/admin/api/admin-assignment-api.ts`
- `frontend/src/admin/components/admin-assignment-page.tsx`
- `frontend/src/admin/api/admin-auth-api.ts`
- `frontend/src/admin/lib/routes.ts`
- `.tasks/TASK-FT016-18/TASK-FT016-18-S-VERIFY-final-report-docs-01.md`
- `.tasks/TASK-UIQA-20260513/plan.md`
- `.tasks/TASK-UIQA-20260513/summary.md`
- `.tasks/TASK-FT019-UIQA/TASK-FT019-UIQA-S-01-final-report-ui-qa-01.md`

## Files changed

- `.tasks/TASK-UIQA-COMPLEX-20260514/entrypoints-report.md`

## Checks run

- Read-only shell inspection commands: `sed`, `find`, `grep`, `nl`, `git status --short`.
- No lint/unit/e2e tests were run; this task was an entrypoint mapping task, not implementation or QA execution.
