---
description: Implementation plan for TASK-FT016-04 admin operator orders read surface.
status: active
---
# TASK-FT016-04 Plan

## Plan

1. Inspect existing admin assignment API, route, component, view model and tests.
2. Replace direct-assignment default route behavior with read-only operator orders fetch from `GET /api/v1/admin/operator/delivery/orders`.
3. Add local view-model parsing/formatting for severity, courier marker, latest-message placeholders and expandable history.
4. Update focused admin API/route tests for the read model and absence of primary direct assignment CTA.
5. Run focused admin tests, `npm run build:frontend`, and `git diff --check`.
6. Write implementation report to `.tasks/TASK-FT016-04/TASK-FT016-04-S-IMPL-final-report-code-01.md`.

## Richer Inputs

- Task card found in `.memory-bank/tasks/backlog.md`.
- Source plan found in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`.
- Normative feature and contract found in `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md` and `.memory-bank/contracts/operator-delivery-ops-contract.md`.
- No fallback required beyond the standard core specs.

## Architecture

- Owning capability slice: `delivery-tracking`.
- Owning contour: `admin-web`.
- Touched layers: frontend ui/app/API adapter/tests.
- Shared justification: no shared extraction; this is a route-local admin read surface.
