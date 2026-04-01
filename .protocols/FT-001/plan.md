---
description: План декомпозиции FT-001 в implementation plan и execution-ready backlog.
status: active
---
# FT-001 Decomposition Plan

## Goal

- Разложить `FT-001` на атомарные implementation tasks для публичной витрины и seller-scoped catalog management.

## Inputs used

- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../../.memory-bank/features/FT-001-catalog-browse-and-seller-management.md): owning feature spec.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и customer-facing context.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-001`, `REQ-002`, `REQ-020` и RTM.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): slice boundaries.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): soft-delete, snapshot и persistence ownership.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline.

## Current repository state

- Репозиторий пока практически документационный: `backend/`, `frontend/` и `admin-web/` как runtime directories отсутствуют.
- Поэтому W1 включает не доработку существующего кода, а skeleton/scaffold задачи для owning `catalog` slice.

## Decomposition strategy

1. W1: зафиксировать catalog contracts и поднять базовый slice skeleton.
2. W2: реализовать backend read/write paths для shops/products и rename policy.
3. W3: собрать public browse UI, тестовый контур и docs sync.

## Constraints

- `FT-001` не создает отдельную seller capability вне `catalog`.
- Public browse должен работать без auth.
- Seller writes должны быть ограничены ownership policy.
- Rename rule: одна бесплатная попытка, дальше manual paid flag; `shop_name_snapshot` в заказах не должен мутировать.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-001.md`
- backlog section с `TASK-FT001-*`
- execution-ready первая волна для старта `FT-001`
