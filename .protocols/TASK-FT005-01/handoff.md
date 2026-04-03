---
description: Handoff notes for TASK-FT005-01.
status: active
---
# TASK-FT005-01 Handoff

## Completed
- Docs-first boundary for `FT-005` is frozen across feature, implementation plan, polling contract, lifecycle state doc, testing baseline, backlog, and navigation.

## Ready follow-ups
- `TASK-FT005-02`: scaffold backend `delivery-tracking` slice and persistence/test baseline.
- `TASK-FT005-03`: scaffold polling consumer/runtime harness for downstream UI and bot integration.

## Guardrails for next task
- Keep business ownership of post-assignment transitions inside `delivery-tracking`; do not leak lifecycle rules into shared transport layers.
- Preserve invalid-transition behavior as HTTP `409 CONFLICT` with no order/history/event side effects.
- Preserve polling contract as ordered plus string-only opaque `since`/`revision`/`next_cursor`; empty-window and repeated reads must stay duplicate-safe.
- Do not mark `REQ-010` done until explicit latency evidence is collected in the final `FT-005` verification wave.
