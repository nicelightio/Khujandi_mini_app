---
description: Отчет по backend runtime фиксу CORS preflight для FT-015 curation DELETE endpoints.
status: done
---
# TASK-FT015-FIX-BACKEND-CORS

## Итог

PASS. Узкий backend/runtime баг закрыт без изменений frontend и `.memory-bank`.

## Изменения

- `backend/src/dev-runtime/dev-api-server.ts`: глобальный `OPTIONS` short-circuit теперь для FT-015 curation resource paths возвращает `Access-Control-Allow-Methods: POST,DELETE,OPTIONS`.
- `tests/slices/catalog/catalog.runtime.showcase.cases.ts`: добавлен focused runtime-тест для:
  - `OPTIONS /api/v1/admin/catalog/showcase/products/:productId`
  - `OPTIONS /api/v1/admin/catalog/showcase/shops/:shopId`

## Проверки

- `npm run test:catalog:runtime -- --runInBand` — PASS, 30/30.
- `git diff --check -- backend/src/dev-runtime/dev-api-server.ts tests/slices/catalog/catalog.runtime.showcase.cases.ts` — PASS; PowerShell/Git вывел только ожидаемое предупреждение LF -> CRLF для tracked `dev-api-server.ts`.

## Остаточные риски

- Не трогались atomic favorite cap и audit/event boundary по явному scope задачи.
- Worktree до задачи уже содержал незакоммиченные FT-015 изменения; они не откатывались.
