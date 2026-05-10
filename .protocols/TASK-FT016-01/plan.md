---
description: Execution plan for TASK-FT016-01 lifecycle and role compatibility.
status: active
---
# TASK-FT016-01 Plan

## Richer Inputs

- Found task card fields: source, constraints, touched files, tests, verify criteria.
- Found implementation plan: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`.
- Found normative specs: `FT-004`, `FT-005`, `FT-016`, `FT-014`, `order-lifecycle`, `api-events-baseline`.

## Steps

1. Inspect Prisma schema, migrations, status/role domain types, frontend parser tests.
2. Add additive enum compatibility for `DELAYED`, `PICKED_UP`, `OPERATOR`.
3. Update affected TypeScript unions/parsers so values are representable without enabling new transitions.
4. Add focused compatibility tests for old and new statuses/role representation.
5. Run required checks:
   - `npx prisma validate`
   - focused backend compatibility tests
   - `npm run test:order-tracking:frontend`
   - `git diff --check`
6. Write implementation report to `.tasks/TASK-FT016-01/TASK-FT016-01-S-IMPL-final-report-code-01.md`.

## Out Of Scope Guard

- No assignment offers, courier availability fields, bot menu, auto-offer, operator panel, timeout, claim, v2 transition validation, or data rewrite.
