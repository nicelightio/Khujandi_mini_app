# TASK-FT011-05 Red Verification

## Semantic verdict
- `semantic-pass`

## Top substance risks
- Существенных semantic-рисков в границах задачи не обнаружено.

## Hidden assumptions
- Проверка assumes, что mounted runtime restart на том же `catalogDatabasePath` является нормативным durability сценарием для automated layer; broader manual/operator proof после реального restart/reset по-прежнему остается вне scope этой задачи.
- Проверка relies on уже закрытый `TASK-FT011-04`: seller/storefront reads после restart считаются canonical только потому, что mounted runtime больше не резолвит их из прямого `catalogState` fallback.

## Cross-boundary impact
- Новый runtime regression усиливает не только `catalog` test surface, но и boundary между `admin provisioning` и seller/public storefront resolution: повторный identical provisioning после restart теперь проверяется на mounted HTTP-path, а не только на repository/integration уровне.
- Явный gate `npm run test:catalog:runtime` уменьшает риск, что later changes в `dev-runtime` quietly сломают DB-backed durability path, не затронув unit/integration suites.

## Architectural concerns
- Новая задача не добавляет runtime workaround, второй source of truth или compatibility shim; она сужается до evidence/gate surface и остается согласованной с `FT-011` intent.

## State/data consistency concerns
- Ключевая hostile hypothesis была: repeated provisioning after restart может формально вернуть `409`, но при этом оставить duplicate/partial durable rows или повторно засеять starter bundle. Проверенный runtime spec это отсекает: после restart на том же DB path остается ровно один `shop`, один `binding`, две starter `menuPages` и два starter `products`.

## Operational concerns
- Dedicated command `npm run test:catalog:runtime` делает mounted durability suite явным quality gate вместо скрытой части общего `test:catalog` прогона.
- Residual operational closure все еще открыта только там, где и заявлено в спецификациях: final manual `provision -> restart/reset -> /shops/:shopId` smoke и RTM promotion принадлежат `TASK-FT011-06`, а не этой задаче.

## Future maintenance cost
- Стоимость сопровождения низкая: добавлен один целевой Jest gate и narrow runtime regressions без расширения production surface.

## How this could still be wrong
- Если будущий drift сломает реальный operator restart path, но оставит test helper/startup path эквивалентным, это поймает уже не `TASK-FT011-05`, а финальный manual closure `TASK-FT011-06`.
- Если later runtime changes reintroduce a non-normative mirror/fallback outside покрытого mounted path, этот task alone не гарантирует полную feature closure; он лишь закрывает automated regression layer, как и заявлено в backlog/spec.

## Counterproposal / escalation path
- Эскалация не требуется.
- Продолжить normal loop через `TASK-FT011-06`: manual durability smoke, финальный rerun gates, RTM/docs closure.
