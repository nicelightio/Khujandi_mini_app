---
description: Decision log для декомпозиции FT-011 в waves и task cards.
status: active
---
# FT-011 Decision Log

## Decisions

- 2026-04-13: `FT-011` декомпозируется как runtime-baseline feature внутри owner slice `catalog`, а не как новая capability; seller/customer/admin behavior остается у уже существующих feature specs.
- 2026-04-13: Отдельный docs-freeze task не вводится, потому что `FT-011` уже имеет достаточный normative layer через feature, contracts, architecture и testing docs.
- 2026-04-13: Для навигации используются feature-scoped task IDs вида `TASK-FT011-0X`.
- 2026-04-13: Перевод repo-local runtime на DB-backed baseline должен предшествовать финальной durability verification, иначе restart-safe acceptance нельзя считать доказанной.
- 2026-04-13: Manual restart smoke является blocking closure artifact для `FT-011`, а не optional supporting evidence.

## Open questions

- Нужен ли checked-in repo отдельный lightweight reset/bootstrap helper для локального ручного smoke, или достаточно Prisma migrate/seed плюс restart существующего `dev:api` runtime.
- Следует ли сохранять `InMemoryCatalogRepository` только для isolated tests, или часть runtime integration harness тоже должна перейти на Prisma-backed temporary DB path.

## Notes

- Primary RTM ownership feature остается на `REQ-027` и `REQ-028`; existing `FT-010` seller contour evidence here only acts as an upstream dependency, not as duplicated closure work.
- Process-local seeded storefront data рассматривается как current drift, а не как compatibility promise.
