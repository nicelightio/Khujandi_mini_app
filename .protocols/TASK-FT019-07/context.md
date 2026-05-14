---
description: Execution context for TASK-FT019-07 admin-web Staff panel route and tables.
status: active
---
# TASK-FT019-07 Context

## Role

ROLE: SUBAGENT
TYPE: implementer

## Owning slice / contour / layers

- Owning capability slice: `admin-access`.
- Owning contour: `admin-web`.
- Touched layers:
  - frontend UI/app route for `/admin/staff`;
  - frontend typed API client for the verified Staff panel list endpoints;
  - existing admin-web navigation/router role boundary.

## Shared extraction check

No new `shared` extraction is justified. The page is a single admin-web surface over two explicit Staff panel resources (`couriers` and `operators`) and consumes backend Staff panel API read models. A generic CRM/staff abstraction would broaden ownership without reuse evidence and would hide the required courier/operator terminology.

## Spec inputs read

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
- `.tasks/TASK-FT019-06/TASK-FT019-06-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT019-06/TASK-FT019-06-S-VERIFY-final-report-code-01.md`
- `.protocols/TASK-FT019-06/context.md`
- `.protocols/TASK-FT019-06/verification.md`

## Boundary notes

- Use verified route shape from TASK-FT019-06: `/api/v1/admin/staff/couriers` and `/api/v1/admin/staff/operators`.
- Staff panel route and navigation are visible only for authenticated `admin`/`boss` frontend sessions; `operator` receives a frontend forbidden state and no Staff page fetch.
- Default staff lists request active staff only. `boss` may toggle `includeInactive=true`; `admin` does not get archive controls.
- This task is read-only from the UI perspective: no create/deactivate/reactivate/password reset/nickname/rating workflows.
- Do not render passwords, password hashes, hard delete affordances, or generic CRM staff wording.
- Do not change backend API/runtime routes, Prisma schema, lifecycle statuses, or `OrderStatus.FAILED`.
