---
description: Execution context for TASK-FT019-09 admin-web Staff detail cards.
status: active
---
# TASK-FT019-09 Context

## Role

- `ROLE: SUBAGENT`
- `TYPE: implementer`

## Task

Implement the bounded admin-web Staff detail cards/history UX on top of verified Staff panel list and command workflows.

## Required Specs Read

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.memory-bank/tasks/backlog.md`

## Prior Task Evidence Read

- `TASK-FT019-05` implementation and verification reports
- `TASK-FT019-06` implementation and verification reports
- `TASK-FT019-07` implementation and verification/repair reports
- `TASK-FT019-08` implementation and verification reports

## Micro-Check

- Owning capability slice: `admin-access` for the Staff panel admin-web boundary.
- Owning contour: `admin-web`.
- Touched layers: frontend UI, route-local app state, and frontend Staff API client only.
- Shared extraction: not justified. The detail cards are Staff-panel-specific presentation over already verified backend Staff API read models. No repeated cross-slice frontend primitive or general CRM abstraction is needed.

## Scope Guard

- Use only verified backend Staff API read endpoints.
- Do not edit backend routes, Prisma schema, order lifecycle/status, or Staff product contract.
- Do not add delivery/review mutation controls in cards.
- Do not expose password hashes, saved passwords, or one-time passwords in detail cards.
- Preserve operator denial and boss archive/list behavior.
