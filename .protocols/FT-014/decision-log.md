---
description: Decision log for FT-014 decomposition.
status: active
---
# FT-014 Decision Log

## 2026-04-25

- Decision: keep `delivery-tracking` as the owner of customer-facing status visibility while preserving `FT-005` ownership of lifecycle/event semantics.
- Rationale: `FT-014` is a read-only customer consumer over the existing tracking contract; duplicating state-machine rules in the customer contour would create drift.
- Decision: make status entry depend on `FT-013` paid-order identity and polling metadata instead of creating a standalone fake tracking route.
- Rationale: the customer status screen must be tied to the actual paid `CREATED` order and must recover safely if identity is missing.
- Decision: keep cancellation/refund display customer-safe only and leave commands/refund tracking ownership with `FT-006`.
- Rationale: customer visibility may render terminal cancellation states, but operational actions remain outside the `mini-app` customer contour.
