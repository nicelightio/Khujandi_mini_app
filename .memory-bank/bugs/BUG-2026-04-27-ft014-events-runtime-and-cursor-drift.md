---
description: Resolved repo-local FT-014 integration blocker for mounted customer events runtime and checkout/status cursor drift.
status: archived
---
# BUG-2026-04-27 FT-014 Events Runtime And Cursor Drift

## Summary

`TASK-MB-REVIEW` found that `FT-014` frontend/customer status work was not enough for final closure: the checked-in Mini App status consumer called `GET /api/v1/events?since=<cursor>`, but the repo-local runtime did not mount that endpoint for the customer path, and checkout success could pass `order.id` as the initial cursor/revision while the delivery-tracking event repository expected a numeric cursor path.

`TASK-FT014-07` resolved the repo-local blocker by mounting the customer events route, filtering customer-visible events by current Mini App session order ownership, returning checkout success `revision` from the event-stream cursor, and accepting opaque non-numeric cursor strings without runtime parse failure.

## Impact

- `REQ-033` remains `planned` rather than `verified` because final `TASK-FT014-06` still depends on upstream Android checkout evidence.
- `TASK-FT014-06` no longer waits on repo-local polling repair, but still stays blocked by `TASK-FT013-08`.
- Customer paid-order-to-status e2e evidence can now rely on checked-in mounted event endpoint, customer/order event scoping, and compatible cursor handoff evidence from `TASK-FT014-07`.

## Evidence

- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-01-final-report-docs-01.md`
- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-03-final-report-docs-01.md`
- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-04-final-report-docs-01.md`
- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-06-final-report-docs-01.md`

## Required Closure

- Done in `TASK-FT014-07`: mount the checked-in `GET /api/v1/events?since=<cursor>` customer polling route used by the Mini App status surface.
- Done in `TASK-FT014-07`: prove customer/order scoping with negative checks so customer sessions cannot read unrelated order events.
- Done in `TASK-FT014-07`: align checkout success metadata with `FT-005` cursor semantics so `since`, `revision`, and `next_cursor` remain opaque string API values without causing numeric parser failures.
- Re-run final `FT-014` e2e/docs closure only after `TASK-FT014-07` and upstream `TASK-FT013-08` evidence are complete.

## Related

- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `TASK-FT014-07`
- `TASK-FT014-06`
