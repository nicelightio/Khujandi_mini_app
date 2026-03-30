---
description: ADR по выбору layered monolith + vertical slices как основной архитектурной модели MVP.
status: active
---
# ADR-001 Layered Monolith Vertical Slices

## Decision

MVP строится как `layered monolith`, организованный вокруг capability-based `vertical slices`.

## Why

- Это минимизирует распределенную сложность.
- Позволяет поставлять end-to-end ценность по одному slice.
- Снижает риск premature shared abstractions.

## Consequences

- Архитектурные и тестовые границы проходят по slices.
- Shared код ограничивается техническими primitives.

## Sources

- `doc/PRD.md`
- `doc/ARCHITECTURE.md`
