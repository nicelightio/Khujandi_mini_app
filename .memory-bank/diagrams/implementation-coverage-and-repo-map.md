---
description: ASCII-карта покрытия spec-to-code и текущего устройства репозитория для AI-агентов.
status: active
---
# Implementation Coverage And Repo Map

## Why this matters

- Схема показывает, где код уже существует, а где пока есть только спецификации.
- Это снижает риск ложных предположений о наличии готовых модулей для будущих features.

## Coverage map

```text
Spec layer                          Current repo implementation
--------------------------------    ---------------------------------------------
EP-001 customer ordering            FT-001 catalog        -> implemented
                                    FT-002 checkout       -> spec only
                                    FT-003 localization   -> spec only
                                    FT-009 mini-app shell -> partial shared shell primitives

EP-002 delivery operations          FT-004 assignment     -> spec only
                                    FT-005 tracking       -> spec only
                                    FT-006 cancellation   -> spec only

EP-003 admin access/security        FT-007 admin auth     -> spec only

EP-004 reviews and alerts           FT-008 reviews        -> spec only
```

## Repo map

```text
Khujandi_mini_app/
|
+-- .memory-bank/              WHY / WHERE / specs / navigation
|   +-- product.md
|   +-- requirements.md
|   +-- epics/
|   +-- features/
|   +-- architecture/
|   +-- contracts/
|   +-- states/
|   +-- diagrams/
|
+-- backend/
|   +-- prisma/
|   \-- src/
|       +-- slices/
|       |   \-- catalog/
|       |       +-- presentation/
|       |       +-- application/
|       |       +-- domain/
|       |       \-- infrastructure/
|       \-- shared/
|           +-- db/
|           +-- errors/
|           \-- testing/
|
+-- frontend/
|   \-- src/
|       +-- app/
|       +-- slices/
|       |   \-- catalog/
|       |       +-- routes/
|       |       +-- components/
|       |       +-- hooks/
|       |       +-- model/
|       |       \-- api/
|       \-- shared/
|           +-- telegram/
|           +-- state/
|           +-- i18n/
|           +-- styles/
|           +-- ui/
|           \-- lib/
|
+-- tests/
|   \-- slices/
|       \-- catalog/
|
+-- .tasks/                     task outputs / reports
\-- .protocols/                 task-local working context
```

## Interpretation rules

- Если feature не показана как `implemented`, агент не должен предполагать наличие ее backend/frontend slices.
- `catalog` сейчас является главным реальным reference slice для паттернов структуры и тестов.
- `FT-009` пока выражен в основном как shell-enabling shared primitives, а не как завершенный feature slice.

## Normative sources

- [.memory-bank/features/index.md](../features/index.md)
- [.memory-bank/index.md](../index.md)
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md)
