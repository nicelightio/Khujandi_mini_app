---
description: Execution context for TASK-FT019-08 admin-web Staff panel roster command workflows.
status: active
---
# TASK-FT019-08 Context

## Role

ROLE: SUBAGENT
TYPE: implementer

## Owning slice / contour / layers

- Owning capability slice: `admin-access` for Staff panel UI access/navigation/command boundary.
- Owning contour: `admin-web`.
- Touched layers:
  - frontend Staff panel API client over verified backend Staff endpoints;
  - frontend Staff route state for command submission, one-time password response state and table refresh;
  - frontend Staff page controls/forms inside the existing admin-web presentation style;
  - focused admin-web Staff API/route tests.

## Shared extraction check

No new `shared` extraction is justified. The command workflows are local to the `admin-web` Staff panel and explicitly preserve separate `courier` and `operator` resources. A generic staff/CRM abstraction would hide the required terminology and broaden ownership without reuse evidence.

## Spec inputs read

- `/home/serg/.codex/skills/frontend-design/SKILL.md`
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
- `.tasks/TASK-FT019-07/TASK-FT019-07-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT019-07/TASK-FT019-07-S-VERIFY-final-report-code-01.md`
- `.tasks/TASK-FT019-07/TASK-FT019-07-S-FIX-final-report-code-03.md`
- `.tasks/TASK-FT019-07/TASK-FT019-07-S-VERIFY-final-report-code-04.md`

## Boundary notes

- Use verified route shape from TASK-FT019-06:
  - `/api/v1/admin/staff/couriers`
  - `/api/v1/admin/staff/operators`
  - resource command paths below those roots.
- Courier create accepts only `telegram_user_id` and `nickname`; no email/password fields in that workflow.
- Operator create posts `email`, `nickname`, `password` only; no role selector and no `ADMIN`/`BOSS` creation affordance.
- Soft delete/deactivate is the only removal workflow; no hard delete UI.
- Reactivation, operator password reset and nickname update are visible only for `boss`.
- One-time operator password is UI response state only and must be cleared on dismissal; it must not be stored in table/list state.
- Rating adjustment is only `+1` / `-1` for staff order/processed-order rating; client review average labels remain read-only.
- Do not implement staff cards/history panels; those remain TASK-FT019-09.
- Do not change backend API/runtime routes, Prisma schema, order lifecycle, `OrderStatus.FAILED`, or Staff product contract.
