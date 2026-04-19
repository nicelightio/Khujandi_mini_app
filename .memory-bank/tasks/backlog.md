---
description: Backlog и execution plan (waves) для реализации.
status: active
---
# Backlog

> `/prd` rule: этот backlog не должен автоматически порождать TASK-IDs. Декомпозиция делается точечно через `/prd-to-tasks FT-<NNN>`.

## Current state

- Historical task cards вынесены из active backlog в archive layer, чтобы `backlog.md` оставался коротким canonical entrypoint для `/prd-to-tasks`, `/execute`, `/autopilot` и `/mb-sync`.
- Сейчас в active backlog нет execution-ready `TASK-*` card; при появлении новой feature decomposition новые активные task cards должны добавляться именно в этот файл.
- Existing implementation plans остаются в [.memory-bank/tasks/plans/index.md](plans/index.md): роутер по `IMPL-*` планам.

## Recommended feature order

1. `FT-001`, `FT-002`, `FT-003`, `FT-009`, `FT-010` для первой customer-facing и seller storefront волны.
2. `FT-004`, `FT-005`, `FT-006` для delivery operations.
3. `FT-007` для отдельного admin auth/security контура.
4. `FT-008` для post-delivery feedback loop и go-live hardening.

## Archive

- [.memory-bank/tasks/archive/backlog-full-pre-compaction-2026-04-19.md](archive/backlog-full-pre-compaction-2026-04-19.md): Полная historical копия исходного `backlog.md` до compaction; canonical archive source.
- [.memory-bank/tasks/archive/index.md](archive/index.md): Роутер по архивам historical task cards.
- [.memory-bank/tasks/archive/FT-001-to-FT-003.md](archive/FT-001-to-FT-003.md): Summary/navigation archive для `FT-001` ... `FT-003`.
- [.memory-bank/tasks/archive/FT-004-to-FT-006.md](archive/FT-004-to-FT-006.md): Summary/navigation archive для `FT-004` ... `FT-006`.
- [.memory-bank/tasks/archive/FT-007-to-FT-009.md](archive/FT-007-to-FT-009.md): Summary/navigation archive для `FT-007` ... `FT-009`.
- [.memory-bank/tasks/archive/FT-010-to-FT-011.md](archive/FT-010-to-FT-011.md): Summary/navigation archive для `FT-010` ... `FT-011`.

## Active task queue

- No active `TASK-*` cards at the moment.
- When a new feature is decomposed via `/prd-to-tasks FT-<NNN>`, append only active/planned cards here and move completed historical waves back to archive during periodic MB compaction.

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
