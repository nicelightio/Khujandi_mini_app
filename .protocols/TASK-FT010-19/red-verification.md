---
description: Adversarial semantic verification for TASK-FT010-19.
status: active
---
# TASK-FT010-19 Red Verification

## Semantic verdict
- `semantic-pass`

## Top substance risks
- Существенных semantic-break рисков в текущем checked-in scope не обнаружено.

## Hidden assumptions
- `unpagedProducts` трактуется как seller-only compatibility path для owner storefront reads, а не как новый публичный browse contract.
- Истинный checked-in runtime surface для этой задачи по-прежнему находится в `backend/src/dev-runtime/dev-api-server.ts`; Prisma/runtime widening вне mounted repo-local path пока не требуется для closure этой follow-up задачи.

## Cross-boundary impact
- Public browse semantics не расширены: fallback browse path по-прежнему использует только public `shops/products`, а owner-only legacy compatibility приходит только из protected seller payload.
- Shared storefront tree сохранён: не появился второй seller storefront и не добавлена synthetic menu-page reconstruction logic.

## Architectural concerns
- Решение добавляет явный compatibility field вместо неявной реконструкции, что лучше соответствует intent `TASK-FT010-19` и не размывает boundaries между public browse и protected seller read.
- Future cleanup cost остаётся ограниченным: когда legacy unpaged data исчезнет из checked-in/runtime state, compatibility branch можно будет убрать локально без пересборки product model.

## State/data consistency concerns
- Owner storefront больше не теряет реальные товары из-за отсутствия `menuPageId` или missing page linkage.
- Product edit path сохраняет `menuPageId: null` для legacy items и не создает ложную привязку к странице меню.

## Operational concerns
- Текущая проверка покрывает repo-local mounted runtime, frontend parsing, route rendering и build/lint surface; для данного task scope этого достаточно.
- Дополнительных observability/retry/state-machine рисков задача не вводит, потому что change не меняет write semantics и не расширяет auth boundary.

## Future maintenance cost
- Небольшое увеличение payload/UI branching есть, но оно узко ограничено legacy compatibility path и прозрачно протестировано.

## How this could still be wrong
- Если будущий mounted non-dev runtime для seller storefront будет реализован отдельно от текущего `dev-runtime`, тот runtime тоже должен будет сохранить тот же compatibility semantics; иначе drift вернется уже вне checked-in local path.

## Counterproposal / escalation path
- Дополнительный follow-up не требуется.
- При появлении отдельного mounted seller runtime вне `dev-runtime` нужно сразу перенести туда compatibility semantics или явно закрыть legacy data migration before mount.
