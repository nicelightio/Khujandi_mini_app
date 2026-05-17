---
description: Implementation report for staging Telegram bot runtime courier actions.
status: final
---
# Telegram Bot Runtime Implementation Report

## Result

Implemented real staging Telegram bot runtime support for courier actions in the `telegram-bot` contour, using existing `delivery-assignment` and `delivery-tracking` application services.

What now works:
- `POST /api/v1/telegram/webhook` accepts Telegram `message` and `callback_query` updates; real Telegram-token runtime requires `TELEGRAM_WEBHOOK_SECRET`.
- Optional polling starts only when `TELEGRAM_BOT_POLLING=TRUE` and the bot token looks like a real Telegram token.
- `/start` or `Курьер` sends the courier menu with inline buttons.
- Availability callbacks resolve Telegram `from.id` to courier staff before calling `startCourierWork`, `stopCourierWorkAfter`, or `setCourierAutoOfferParticipation`.
- Manual/broadcast offer notifications include `Принять заказ` inline callback buttons.
- Claim callbacks resolve Telegram `from.id` to courier staff and then use existing atomic `claimOffer`.
- Status callbacks resolve Telegram `from.id` to courier staff and then use existing `recordStatusTransition` for `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.
- Outbound Telegram API failures remain transport-only and do not roll back committed domain writes.

## Slice / Contour / Layers

- Owning capability slices: `delivery-assignment`, `delivery-tracking`.
- Owning contour: `telegram-bot`.
- Touched layers: dev-runtime presentation adapter, integration Telegram transport adapter, existing application-service calls.
- Shared extraction: not justified; the new code is a staging/runtime adapter and uses existing slice services.

## Files Inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/guides/events-polling-and-bot-integration.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `backend/src/dev-runtime/*`
- `backend/src/dev-runtime/routes/*`
- `backend/src/integrations/telegram-bot/*`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/delivery-tracking/**/*`
- focused delivery-assignment/tracking runtime and unit tests.

## Files Changed

New:
- `backend/src/dev-runtime/telegram-bot-api.ts`
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts`
- `.tasks/TASK-UIQA-COMPLEX-20260514/telegram-bot-runtime-implementation-report.md`

Edited for this task:
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier.ts`
- `docker-compose.yml`
- `scripts/dev-api.ts`
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`
- `.memory-bank/index.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`

Pre-existing partial edits reviewed and kept:
- `DeliveryAssignmentService.findCourierStaffByTelegramUserId`
- `DeliveryAssignmentController.getCourierStaffByTelegramUserId`
- offer/assigned buttons in `TelegramBotDeliveryAssignmentNotifier`

Note: the working tree already contained unrelated dirty files before this task; those were not reverted.

## Checks Run

Passed:
- `npx jest --config jest.config.cjs tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts --runInBand`
- `npx jest --config jest.config.cjs tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts --runInBand`
- `npx jest --config jest.config.cjs tests/slices/delivery-tracking/delivery-tracking.unit.spec.ts --runInBand`
- `npx jest --config jest.config.cjs tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts --runInBand`
- `APP_ENV=test NODE_ENV=test PAYMENT_PROVIDER=mock E2E_TEST_MODE=TRUE npx jest --config jest.config.cjs tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts --runInBand`
- `git diff --check` on touched files.

Observed pre-existing/runtime-env issue:
- `npx jest --config jest.config.cjs tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts --runInBand` without explicit mock env fails two checkout setup cases with `503` before tracking assertions.
- The same suite passes with explicit non-production mock payment env shown above.

## Blockers / Risks

- Real Telegram staging smoke was not run from this subagent; it requires ignored env secrets and staging bot token.
- Polling is process-local KISS runtime; it is explicitly staging-gated and not a HA production bot worker.
- Webhook route requires secret validation when a real Telegram token is configured; staging polling is the preferred first smoke path because webhook setup details were not provided.
- The repo has unrelated dirty changes and untracked UI QA artifacts already present; integration should review full working tree before commit.

## Recommendation

Use staging with:

```bash
TELEGRAM_BOT_TOKEN=<staging bot token>
TELEGRAM_BOT_POLLING=TRUE
APP_ENV=staging
NODE_ENV=staging
```

Then manually smoke with a courier Telegram account that exists in Staff/courier state: open `Курьер`, toggle availability, create a manual offer from admin, claim it in bot, then progress `PICKED_UP -> IN_PROGRESS -> DELIVERED`.
