---
description: Protocol plan and handoff for FT-019 Staff panel decomposition.
status: active
---
# FT-019 Protocol Plan

## Scope

- Feature: `FT-019` Staff panel.
- Owning capability: Staff management surface in `admin-web`, implemented through existing slice boundaries instead of a new shared CRM layer.
- Primary contour: `admin-web`.
- Consumed contours: `telegram-bot` only as courier runtime identity/communication background; no bot behavior is implemented by this decomposition.
- Touched layers for future implementation: admin-web presentation/API client, backend presentation/application/read-model boundaries, domain types, Prisma persistence and tests.
- Slice ownership:
  - `admin-access`: web operator account provisioning, password hash policy, session revocation on password reset, auth/RBAC roles.
  - `delivery-assignment`: courier staff roster fields, courier active/auto-offer/rating penalty source data.
  - `delivery-tracking`: order lifecycle/status history and operator write-action evidence.
  - `reviews-feedback`: courier average client review rating source data.
- Shared justification: no shared extraction is justified for FT-019. Cross-slice reads must stay explicit read models or repository interfaces; no shared staff/CRM abstraction should be introduced.

## Inputs Read

- AGENTS instructions from prompt.
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/commands/prd-to-tasks.md`
- Existing admin/backend file map for expected touched files.

## Decomposition Strategy

1. Foundation: add the minimal explicit persistence/domain contracts needed for staff metadata, soft delete and manual rating adjustments.
2. Backend commands: implement operator account commands inside `admin-access` and courier staff commands against the courier roster boundary without changing delivery lifecycle ownership.
3. Read models: build list/card metrics from delivery, review and auth source data as read models.
4. Runtime API: expose admin-protected Staff panel routes with role gates and one-time password response semantics.
5. Admin-web UX: add route, tables, command workflows and staff cards.
6. Verification: close RBAC, password, metrics, soft-delete/archive/reactivation and docs evidence.

## Gate

- Implementation must start from [.memory-bank/tasks/plans/IMPL-FT-019.md](../../.memory-bank/tasks/plans/IMPL-FT-019.md).
- `operator` must remain forbidden from Staff panel.
- Staff panel must never create `ADMIN` or `BOSS` accounts.
- Plaintext password must never be stored, logged or included in audit payloads.
- `FAILED` order status must not be added in FT-019.
- Soft delete/deactivate must preserve historical order/review/audit references.
- Any need for a new shared staff abstraction is an architecture decision and must be reported before implementation proceeds.
