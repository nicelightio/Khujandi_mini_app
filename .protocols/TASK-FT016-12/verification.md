---
description: Verification report for TASK-FT016-12 offer timeout evaluator.
status: active
---
# TASK-FT016-12 Verification

## Verdict

PASS

## Scope Checked

- Owning capability slice: `delivery-assignment`.
- Owning contour: backend explicit application command with protected dev-runtime/manual tick route and Telegram bot notification boundary.
- Touched layers verified: application, domain contracts, infra/persistence, narrow runtime route, Telegram notifier adapter, focused tests and task docs.
- Shared extraction: none; timeout policy remains slice-local and uses existing DB/event/error/notifier primitives.

## Evidence

- Timeout evaluator is an explicit callable command: `DeliveryAssignmentService.evaluateOfferTimeouts`, controller delegation, and protected `POST /api/v1/admin/operator/delivery/offer-timeouts/tick` runtime route. No Redis, queue, cron daemon, background worker, microservice, GPS/maps/routing or dispatch optimization was added.
- Repeat notification path records `order.offer_repeated` after the 3-minute cutoff for still-pending offers, sends the courier reminder only after persistence, and uses existing event-based idempotency so repeated manual ticks do not duplicate the repeat artifact or notification.
- Expiry path marks still-pending offers `EXPIRED` after the 6-minute cutoff, sets unassigned `CREATED` orders to `DELAYED` or keeps existing `DELAYED`, writes `CREATED -> DELAYED` history only after the persisted status update, and records `order.assignment_timeout` / `order.delayed` after persistence.
- Operator delayed alert uses the existing Telegram notifier/dispatcher boundary and no durable queue. Repeated evaluator calls do not re-alert for already-expired offers because the offer is no longer `PENDING` and the timeout event is already present.
- Personal/manual targeted offers decrement the target courier `ratingScore` once on expiry; broadcast offers expire without courier penalty.
- Claimed/accepted offers, `ASSIGNED` orders, orders with `courierId`, terminal/post-assignment lifecycle states and existing claim/direct-assignment semantics are skipped by the evaluator.
- No new claim logic, auto-accept, broadcast behavior change, `PICKED_UP`/completion progression, post-`ASSIGNED` lifecycle mutation or legacy cleanup was added by this task.
- Existing active orders remain readable/operational: runtime smoke covers the manual tick and then reads the operator delivery orders surface with the order visible as `DELAYED`.

## Commands

- `npm run test:delivery-assignment -- --runInBand` - PASS; 5 suites / 50 tests.
- `git diff --check` - PASS.
- Changed markdown local link validation - PASS; 5 files checked before verifier updates, then 6 files checked after verifier updates.

## Residual Risks

- The implementation relies on persisted event/offer state for idempotency and does not add a new database unique constraint for concurrent evaluator races. This matches the KISS/manual tick scope, but a future scheduled or multi-instance evaluator would need a stronger concurrency guard.
- Operator alert fan-out requires active Telegram-backed operator/admin-like `User` targets. If none exist, timeout persistence still succeeds and the operator panel read model shows `DELAYED`.
