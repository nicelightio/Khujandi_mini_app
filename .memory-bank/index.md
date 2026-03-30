---
description: Главная карта знаний проекта (table of contents) для агентов.
status: active
---
# Memory Bank Index

## Навигация

- [.memory-bank/mbb/index.md](mbb/index.md): Правила ведения Memory Bank (MBB).
- [.memory-bank/product.md](product.md): Продукт (C4 L1).
- [.memory-bank/requirements.md](requirements.md): Требования + RTM.
- [.memory-bank/epics/index.md](epics/index.md): Эпики MVP (C4 L2) и их scope.
- [.memory-bank/features/index.md](features/index.md): Feature-спеки MVP (C4 L3) для `/prd-to-tasks`.
- [.memory-bank/tasks/backlog.md](tasks/backlog.md): Backlog / waves.

- [.memory-bank/spec-index.md](spec-index.md): Реестр normative docs и маршрутизация по source-of-truth.
- [.memory-bank/glossary.md](glossary.md): Общий словарь терминов и доменных значений.
- [.memory-bank/invariants.md](invariants.md): Глобальные MUST/NEVER правила.
- [.memory-bank/architecture/index.md](architecture/index.md): Duo + boundaries (WHAT/WHY).
- [.memory-bank/guides/index.md](guides/index.md): Valid HOW docs для использования, запуска и troubleshooting.
- [.memory-bank/adrs/index.md](adrs/index.md): ADR решения.

- [.memory-bank/contracts/index.md](contracts/index.md): Контракты и boundary specs (prefer when present).
- [.memory-bank/states/index.md](states/index.md): Lifecycle/state rules (prefer when present).
- [.memory-bank/runbooks/index.md](runbooks/index.md): Runbooks и operational procedures.
- [.memory-bank/testing/index.md](testing/index.md): Testing strategy.
- [.memory-bank/workflows/index.md](workflows/index.md): Execution/workflow docs для task loop и MB sync.
- [.memory-bank/skills/index.md](skills/index.md): Skill registry.
- [.memory-bank/bugs/index.md](bugs/index.md): Bug records и verification failures.

## Recent updates

- `FT-001`: contract layer extended with `catalog-public-api` and `seller-catalog-write-policy` for docs-first implementation.
- `FT-001`: backend `catalog` scaffold, Prisma baseline, and backend test skeleton added for `TASK-FT001-02`.
- `FT-001`: frontend `catalog` scaffold and public route shell added for `TASK-FT001-03`.

## Current MVP map

- `EP-001`: клиентский путь от public catalog до оплаченного заказа, включая обязательную локализацию.
- `EP-002`: операционный delivery flow: assignment, tracking, polling, cancellation, refund tracking.
- `EP-003`: отдельный security/auth контур веб-админки.
- `EP-004`: post-delivery feedback loop и negative alerts.
