---
description: Роутер по implementation plans и bugfix plans (C4 L4).
status: active
---
# Task Plans Index

- [.memory-bank/tasks/plans/IMPL-FT-001.md](IMPL-FT-001.md): План реализации baseline `catalog` browse и seller ownership.
- [.memory-bank/tasks/plans/IMPL-FT-002.md](IMPL-FT-002.md): План реализации checkout/payment, Telegram auth и paid-only order creation.
- [.memory-bank/tasks/plans/IMPL-FT-003.md](IMPL-FT-003.md): План реализации language selection, persistence fallback и localization baseline.
- [.memory-bank/tasks/plans/IMPL-FT-004.md](IMPL-FT-004.md): План реализации courier assignment и `CREATED -> ASSIGNED`.
- [.memory-bank/tasks/plans/IMPL-FT-005.md](IMPL-FT-005.md): План реализации delivery tracking, events polling и SLA closure.
- [.memory-bank/tasks/plans/IMPL-FT-006.md](IMPL-FT-006.md): План реализации operational cancellation и manual refund tracking.
- [.memory-bank/tasks/plans/IMPL-FT-007.md](IMPL-FT-007.md): План реализации admin auth, lockout и session security.
- [.memory-bank/tasks/plans/IMPL-FT-007-BUGFIX-auth-runtime-cookie-boundary.md](IMPL-FT-007-BUGFIX-auth-runtime-cookie-boundary.md): Bugfix-план для реального admin auth runtime cookie boundary.
- [.memory-bank/tasks/plans/IMPL-FT-008.md](IMPL-FT-008.md): План реализации two-sided reviews и negative alerts.
- [.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-callback-replay-hardening.md](IMPL-FT-008-BUGFIX-review-callback-replay-hardening.md): Bugfix-план для stale Telegram review callback replay hardening.
- [.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-draft-durability.md](IMPL-FT-008-BUGFIX-review-draft-durability.md): Bugfix-план для durable review draft guarantees.
- [.memory-bank/tasks/plans/IMPL-FT-009.md](IMPL-FT-009.md): План реализации Mini App shell/runtime и WebView UX baseline.
- [.memory-bank/tasks/plans/IMPL-FT-010.md](IMPL-FT-010.md): План реализации shared seller storefront edit mode, skeleton provisioning и узкой `seller-web` админки магазина.
- [.memory-bank/tasks/plans/IMPL-FT-011.md](IMPL-FT-011.md): План реализации DB-backed `catalog` runtime baseline, durable provisioning и restart-safe storefront resolution.
- [.memory-bank/tasks/plans/IMPL-FT-012.md](IMPL-FT-012.md): План реализации customer product selection и single-shop cart/order composition перед checkout.
- [.memory-bank/tasks/plans/IMPL-FT-013.md](IMPL-FT-013.md): План реализации customer checkout handoff и mounted paid order creation flow.
- [.memory-bank/tasks/plans/IMPL-FT-014.md](IMPL-FT-014.md): План реализации customer-facing order status visibility поверх `FT-005` polling/event contract.
- [.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md](MIGRATE-FT-004-FT-005-to-FT-016.md): Staged migration plan from implemented v1 delivery operations/admin panel to `FT-016` operator/courier offer flow.
- [.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md](IMPL-FT-016-operator-delivery-migration.md): Execution-ready TASK cards for staged `FT-016` operator delivery migration from implemented `FT-004`/`FT-005` v1 baseline.
