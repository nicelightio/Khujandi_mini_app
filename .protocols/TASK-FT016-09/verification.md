---
description: Verification report for TASK-FT016-09 manual targeted offer creation.
status: active
---
# TASK-FT016-09 Verification

## Verdict

PASS

## Scope Evidence

- Owning slice: `delivery-assignment`.
- Contours touched by implementation: `backend`, `admin-web`, `telegram-bot`.
- Touched layers: application, domain, infrastructure, presentation/runtime route, admin-web API/UI/model, Telegram notifier boundary, focused tests.
- Shared extraction: not introduced; implementation uses existing shared error/runtime/event primitives only.

## Acceptance Evidence

- Manual targeted offer creation exists via `DeliveryAssignmentService.createManualOffer` and the admin runtime route `POST /api/v1/admin/orders/:orderId/assignment-offers`.
- Order status validation is limited to `CREATED|DELAYED` in `DeliveryAssignmentService.assertManualOfferOrder`.
- Target courier validation uses the current courier availability boundary: courier must exist as role `courier`, be active under the stop-after cutoff, and have no busy order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, or `DELIVERED`.
- Successful persistence creates a pending manual `AssignmentOffer` and records `order.offer_created` through the repository transaction path.
- Telegram notification is sent through `TelegramBotDeliveryAssignmentNotifier.notifyCourierOfferCreated` with offer wording and an `order.offer_created` dedupe key.
- Manual offer creation does not update order status, `courierId`, status history, assignment audit, or publish `order.assigned`; focused integration/unit/runtime tests assert these non-side-effects.
- Existing legacy direct assignment remains available as the explicit `/assignment` path and `assignCourier` service method; it was not removed or silently rewritten.
- Admin UI action uses the pending targeted-offer endpoint, renders submit/loading/success/error states, and does not call the legacy direct assignment API for the normal targeted-offer action.
- Out-of-scope behavior was not added: no courier claim/atomic claim command, timeout/`DELAYED` evaluator, auto-offer broadcast trigger, `PICKED_UP`/completion workflow, or legacy direct-assignment cleanup.

## Commands

- `npm run test:delivery-assignment -- --runInBand` — PASS; 3 suites / 32 tests.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx frontend/src/tests/admin/admin-assignment-view-model.spec.ts --runInBand` — PASS; 3 suites / 16 tests.
- `npm run build:frontend` — PASS.
- `git diff --check` — PASS.
- Changed markdown local link validation — PASS; validated local links in 5 changed markdown files.

## Risks / Notes

- The broader `npm run test:delivery-assignment:frontend -- --runInBand` was not rerun as a blocking gate because the implementation report records a known unrelated `admin-router.spec.tsx` catalog provisioning copy expectation drift; the focused admin assignment specs used by this implementation pass.
- Manual offer persistence validates status before the repository write and records the event in the same transaction path. A future claim/timeout phase should consider adding stronger conditional persistence if concurrent order status changes become a real operational race.
