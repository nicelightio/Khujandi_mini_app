---
description: Implementation final report for TASK-FT016-12 offer timeout evaluator.
status: active
---
# TASK-FT016-12 Implementation Report

## Summary

Implemented the offer timeout evaluator as an explicit KISS application command for `delivery-assignment`. It is callable through the service/controller boundary and a protected dev-runtime manual tick route; no background worker, cron, Redis, queue, microservice, auto-accept or broadcast behavior change was added.

## Ownership

- Owning slice: `delivery-assignment`.
- Contour: backend explicit command/manual tick plus Telegram notifier boundary.
- Touched layers: application, domain types, infrastructure/persistence, narrow dev-runtime route, Telegram notifier adapter, focused tests, task docs.
- Shared extraction: none. Timeout policy remains slice-local and uses existing DB/event/error/notifier primitives.

## Implementation

- `evaluateOfferTimeouts` records `order.offer_repeated` once for pending offers older than 3 minutes and sends repeat courier notification after persistence.
- Pending offers older than 6 minutes are atomically marked `EXPIRED`; unassigned `CREATED` orders are moved to `DELAYED`, while existing `DELAYED` orders are kept.
- Timeout persistence writes `order.assignment_timeout` per expired offer and `order.delayed` only when the order actually transitions from `CREATED` to `DELAYED`.
- Operator alerts use the existing Telegram dispatcher-based notifier when operator/admin Telegram `User` targets exist; no durable notification queue was introduced.
- Manual/personal offer timeout decrements the target courier `ratingScore` once because the data model supports it; broadcast offer timeout applies no courier penalty.
- Claimed/accepted offers, `ASSIGNED` orders, orders with `courierId`, completed/terminal/post-assignment lifecycle and existing claim/direct-assignment semantics are ignored.

## Verification Run

- `npm run test:delivery-assignment -- --runInBand` - PASS, 5 suites / 50 tests.
- `git diff --check` - PASS.
- Changed markdown local link validation with `python3` - PASS, 8 files checked.

## Residual Risks

- Idempotency is enforced for repeated evaluator calls through persisted events and `PENDING -> EXPIRED` offer state. There is no new database unique constraint for concurrent evaluator races; adding that would exceed the KISS/manual tick scope.
- Operator alert fan-out depends on active Telegram-backed `User` records with operator/admin-like roles. If no such targets exist, timeout/delayed persistence still succeeds and the operator panel read model shows `DELAYED`.
