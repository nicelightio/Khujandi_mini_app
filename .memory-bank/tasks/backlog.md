---
description: Backlog и execution plan (waves) для реализации.
status: active
---
# Backlog

> `/prd` rule: этот backlog не должен автоматически порождать TASK-IDs. Декомпозиция делается точечно через `/prd-to-tasks FT-<NNN>`.

## Current state

- PRD -> Memory Bank bootstrap завершен на уровне `product`, `requirements`, `epics`, `features`, `testing`.
- `FT-001` декомпозирована в implementation plan и task cards.
- Остальные features пока не декомпозированы в `TASK-*` и ждут точечного `/prd-to-tasks FT-<NNN>`.
- Ближайшее действие: запуск `TASK-FT001-04`.

## Recommended feature order

1. `FT-001`, `FT-002`, `FT-003`, `FT-009` для первой customer-facing волны.
2. `FT-004`, `FT-005`, `FT-006` для delivery operations.
3. `FT-007` для отдельного admin auth/security контура.
4. `FT-008` для post-delivery feedback loop и go-live hardening.

## Decomposed feature backlog

## FT-001 — Catalog Browse And Seller Management

### Wave W1 — low-risk / foundation

### TASK-FT001-01 — Freeze catalog contracts and docs-first boundaries
- TASK-ID: `TASK-FT001-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `none`
- Touched files: `.memory-bank/contracts/catalog-public-api.md`, `.memory-bank/contracts/seller-catalog-write-policy.md`, `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`, `.memory-bank/tasks/plans/IMPL-FT-001.md`, `.memory-bank/index.md`
- Tests: doc-level traceability review against `REQ-001`, `REQ-002`, `REQ-020`
- Verify: подтвердить, что public read, seller ownership и rename policy явно зафиксированы в contract/docs layer и не конфликтуют с RTM
- Docs: `contracts/*`, `features/FT-001`, `tasks/plans/IMPL-FT-001`, `index.md`
- Normative Inputs: `FT-001`, `requirements.md`, `data-boundaries-and-persistence.md`, `testing/index.md`

### TASK-FT001-02 — Scaffold backend catalog slice and Prisma baseline
- TASK-ID: `TASK-FT001-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/catalog/**/*`, `backend/src/shared/**/*`, `tests/slices/catalog/**/*`
- Tests: backend test skeleton for catalog integration/unit coverage
- Verify: backend repo содержит owning `catalog` slice skeleton по слоям и минимальный test harness без premature shared business logic
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: сохранять layered slice structure; не разносить catalog business rules в `shared`

### TASK-FT001-03 — Scaffold frontend catalog slice and public route shell
- TASK-ID: `TASK-FT001-03`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-02`
- Touched files: `frontend/src/app/router.tsx`, `frontend/src/slices/catalog/**/*`, `frontend/src/shared/**/*`, `frontend/src/tests/slices/catalog/**/*`
- Tests: frontend test skeleton for catalog route/UI smoke
- Verify: frontend route shell и slice layout существуют и не смешивают catalog UI с non-catalog business logic
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации

### Wave W2 — core logic

### TASK-FT001-04 — Implement public shop and product reads with soft-delete filtering
- TASK-ID: `TASK-FT001-04`
- Status: `ready`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/presentation/**/*`, `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for unauthenticated browse and exclusion of soft-deleted entities
- Verify: `shops/products` публично читаются без auth и не возвращают soft-deleted data
- Docs: `features/FT-001`, `contracts/catalog-public-api.md`, `changelog.md`
- Verification Targets: public `shops` and `products` browse flow

### TASK-FT001-05 — Implement seller-scoped shop writes and rename policy flags
- TASK-ID: `TASK-FT001-05`
- Status: `ready`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/domain/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for seller ownership on shop writes; unit tests for first-free-then-paid rename flag logic
- Verify: seller может менять только свои shops; rename после бесплатной попытки включает manual paid path markers
- Docs: `contracts/seller-catalog-write-policy.md`, `features/FT-001`, `changelog.md`
- Invariants: `shop_name_snapshot` invariant сохраняется за счет отсутствия cross-table mutation side effects при rename

### TASK-FT001-06 — Implement seller-scoped product writes
- TASK-ID: `TASK-FT001-06`
- Status: `ready`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-002`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/domain/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for seller ownership on product writes and shop/product linkage validation
- Verify: seller не может создавать/изменять product вне собственных shops
- Docs: `contracts/seller-catalog-write-policy.md`, `features/FT-001`, `changelog.md`

### Wave W3 — integration & polish

### TASK-FT001-07 — Wire public catalog UI to backend read path
- TASK-ID: `TASK-FT001-07`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-03`, `TASK-FT001-04`
- Touched files: `frontend/src/slices/catalog/routes/**/*`, `frontend/src/slices/catalog/components/**/*`, `frontend/src/slices/catalog/api/**/*`, `frontend/src/slices/catalog/model/**/*`, `frontend/src/tests/slices/catalog/**/*`
- Tests: UI/integration smoke for public browse rendering and loading/error states
- Verify: Mini App customer-facing catalog route показывает shops/products без auth и корректно обрабатывает empty/loading states
- Docs: `features/FT-001`, `changelog.md`

### TASK-FT001-08 — Add catalog verification suite and final docs sync
- TASK-ID: `TASK-FT001-08`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-04`, `TASK-FT001-05`, `TASK-FT001-06`, `TASK-FT001-07`
- Touched files: `tests/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`, `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`
- Tests: final backend integration, rename unit checks, public browse e2e smoke
- Verify: acceptance criteria из `FT-001` полностью покрыты tests/UAT и RTM остается согласованной
- Docs: `features/FT-001`, `requirements.md`, `changelog.md`, при необходимости `contracts/*`
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`

## Conventions
Each task should include:
- goal
- expected touched files
- tests
- verification steps
- docs-first update

## Task state model
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Depends on: TASK-... | none`

## Task card template
### TASK-001 — short title
- TASK-ID: TASK-001
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: `src/...`, `tests/...`
- Tests: `npm test -- foo`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
