---
description: Decision log for FT-019 Staff panel decomposition.
status: active
---
# FT-019 Decision Log

## 2026-05-14

- Decision: `/prd-to-tasks FT-019` decomposition keeps `Staff panel` in the `admin-web` contour and does not introduce a new canonical MVP slice or shared CRM module.
- Rationale: `FT-019`, `staff-panel-contract` and `doc/ARCHITECTURE.md` define Staff panel as an admin-web surface over existing identity, delivery and review boundaries.

- Decision: future implementation is split by source-of-truth ownership: `admin-access` for operator web accounts/password/session revocation, `delivery-assignment` for courier roster/state fields, `delivery-tracking` for order/write evidence, and `reviews-feedback` for courier average review ratings.
- Rationale: this keeps Staff panel from owning delivery lifecycle, review payloads or auth/session policy while still enabling the required read models.

- Decision: `TASK-FT019-01` is the first `ready` foundation task; downstream implementation tasks are `planned` until the persistence/domain baseline lands.
- Rationale: schema/domain fields for staff metadata, soft delete and rating adjustments are prerequisites for deterministic command/read-model work.

- Decision: `FAILED` remains only a future business bucket mention in Staff panel problem blocks, not an order lifecycle state introduced by FT-019.
- Rationale: `.memory-bank/states/order-lifecycle.md` explicitly requires a separate lifecycle decision before adding `OrderStatus.FAILED`.

- Decision: password create/reset responses may show the new operator password only once, and audit/log payloads must exclude plaintext secrets.
- Rationale: `admin-auth-contract` requires password hashes only and secret-bearing values must not leak into logs/audit.

- Decision: final verification must cover both security and metric semantics before RTM closure for `REQ-038`.
- Rationale: Staff panel acceptance spans role access, operator account creation restrictions, soft-delete visibility, boss-only reactivation/reset, and delivery/review-derived rating metrics.
