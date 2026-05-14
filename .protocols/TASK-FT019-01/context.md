---
description: Контекст и boundary-record для TASK-FT019-01 Staff persistence/domain baseline.
status: active
---
# TASK-FT019-01 Context

## Роль

- `ROLE: SUBAGENT`
- `TYPE: implementer`

## Обязательный контекст прочитан

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT019-01`)
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.protocols/FT-019/plan.md`
- `.protocols/FT-019/decision-log.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`

## Boundary micro-check

- Owning capability: foundation для `Staff panel` staff roster persistence и domain contracts.
- Owning contour: `admin-web`.
- Owning slices:
  - `admin-access` владеет operator staff, потому что operator staff = `AdminAccount(OPERATOR)`.
  - `delivery-assignment` владеет courier staff roster metadata, потому что courier staff = `User(COURIER)` плюс delivery-assignment state.
- Touched layers: persistence (`backend/prisma/schema.prisma`, одна additive migration) и domain contracts (`backend/src/slices/admin-access/domain/**`, `backend/src/slices/delivery-assignment/domain/**`).
- Shared extraction: не обоснован. Изменение добавляет slice-local domain contracts и explicit persistence; общий CRM/user abstraction не вводится.

## Примененные ограничения

- Нет runtime routes, services, frontend UI, password reset behavior, metrics read models, hard delete path или `OrderStatus.FAILED`.
- `User.isActive` остается courier work availability/runtime state и не используется как staff soft-delete.
- Staff soft-delete/archive/reactivation получает explicit staff lifecycle metadata.
- Manual staff rating adjustments получают structured persistence с actor/timestamp metadata.

## Pre-existing scoped drift

- `backend/prisma/schema.prisma` уже имел удаление `UserRole.MANAGER`.
- `backend/prisma/migrations/20260513190000_remove_manager_role/migration.sql` уже существовала как untracked file.
- `backend/src/slices/admin-access/domain/admin-access.types.ts` и `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts` уже переводили historical manager role к canonical `operator`.
