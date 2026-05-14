---
description: Execution context for TASK-FT019-06 Staff panel backend API/runtime routes.
status: active
---
# TASK-FT019-06 Context

## Role

ROLE: SUBAGENT
TYPE: implementer

## Owning slice / contour / layers

- Owning capability slice: `admin-access`.
- Owning contour: `admin-web` backend API/runtime.
- Touched layers:
  - `presentation/runtime route` for admin-web Staff panel HTTP endpoints.
  - `application/domain/infra` in `admin-access` only where needed to expose existing operator staff persistence for deactivate/reactivate/rating commands.
  - dev-runtime provider wiring to consume existing staff readers/commands from `admin-access`, `delivery-assignment`, `delivery-tracking`, and `reviews-feedback`.

## Shared extraction check

No new `shared` extraction is justified. Staff panel is an admin-web surface over two slice-local identities (`AdminAccount(OPERATOR)` and `User(COURIER)`), while metrics remain read models owned by delivery/review slices. A generic CRM/staff abstraction would broaden ownership without repeated cross-slice primitive evidence.

## Spec inputs read

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.memory-bank/tasks/backlog.md`
- `.protocols/TASK-FT019-01..05/{handoff,verification}.md`
- `.tasks/TASK-FT019-01..05/*final-report*.md`

## Boundary notes

- `ADMIN` and `BOSS` may access Staff panel API; `OPERATOR` must receive controlled forbidden responses.
- `admin` sees active staff only. `boss` may request inactive/archive data.
- Staff panel exposes courier and operator resources separately; no generic staff endpoint.
- Courier creation accepts only `telegram_user_id` and `nickname`.
- Operator creation creates only `OPERATOR` account. Runtime creation of `ADMIN`/`BOSS` remains forbidden.
- Password plaintext is response-only on create/reset and must not be persisted.
- `FAILED` remains a defensive read-model bucket only; do not add lifecycle/status enum values.
