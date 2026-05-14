---
description: Context and boundary notes for TASK-FT019-02 operator staff account commands.
status: active
---
# TASK-FT019-02 Context

## Role

ROLE: SUBAGENT
TYPE: implementer

## Task

Implement the `admin-access` backend command/application/infra baseline for operator staff accounts in `FT-019`.

## Required context read

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT019-02`)
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.protocols/FT-019/plan.md`
- `.protocols/FT-019/decision-log.md`
- `.protocols/TASK-FT019-01/handoff.md`
- `.protocols/TASK-FT019-01/verification.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`

## Ownership micro-check

- Owning capability slice: `admin-access`.
- Owning contour: `admin-web` / operational web-admin contour.
- Touched layers: `domain` contracts/types, `application` commands, `infrastructure` Prisma repository adapter, thin controller delegation, focused tests.
- Shared extraction: not justified. The behavior is specific to `AdminAccount(OPERATOR)`, password hash policy, admin sessions and staff lifecycle metadata owned by `admin-access`; moving it to `shared` would create a broad staff/auth abstraction without reuse proof.

## Scope boundaries

- In scope: operator staff account create, boss-only password reset with session revocation, boss-only nickname update, duplicate login and weak password controlled failures, hash-only password persistence, one-time plaintext response state.
- Out of scope: dev-runtime/API routes, frontend Staff panel UI, courier staff commands, staff metrics read models, staff cards, delivery lifecycle changes, `OrderStatus.FAILED`, shared CRM/staff abstraction.

## Drift / risk notes

- `TASK-FT019-01` persistence/domain baseline has no dedicated `password_reset` lifecycle/audit action. This implementation records actor metadata for create and nickname update through existing operator lifecycle events, and uses boss actor authorization plus session revocation for reset. A dedicated persisted reset audit action remains a follow-up/spec decision if required by the orchestrator.
- Existing worktree contains pre-existing modified files, including `.memory-bank/tasks/backlog.md` and `backend/src/slices/admin-access/domain/admin-access.types.ts`; edits must be additive and scoped.
