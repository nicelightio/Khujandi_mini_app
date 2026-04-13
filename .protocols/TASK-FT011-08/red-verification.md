# TASK-FT011-08 Red Verification

## Semantic verdict
- `semantic-pass`

## Why
- `TASK-FT011-08` закрывает substance-gap, открытый предыдущим `red-verify` на `TASK-FT011-07`: durable `Shop(sellerId, name)` invariant теперь согласован не только с provisioning, но и с seller rename path.
- `CatalogService.updateSellerShop(...)` переводит rename-time uniqueness violation в controlled `SHOP_RENAME_CONFLICT` `409`, а mounted repo-local runtime отдает тот же project error envelope вместо raw persistence failure.
- Focused unit, integration, and runtime evidence подтверждают, что конфликт не мутирует ни один из shop names и не ломает existing `REQ-020` rename-count/manual-review semantics.

## Top substance risks
- Для самой задачи blocking substance risks не обнаружены.
- Остаточный feature-level риск остается вне scope этой задачи: `FT-011` в целом еще не закрыт, потому что final mounted read-path/runtime-truth and manual durability smoke принадлежат более поздним задачам.

## Hidden assumptions
- Предполагается, что controlled `409` contract является правильной product-семантикой для same-seller rename collisions; это подтверждено текущими contract docs.
- Предполагается checked-in repo-local runtime scope, а не production multi-instance rollout; это согласовано с `FT-011` constraints.

## Cross-boundary impact
- Изменение корректно reconciles `FT-011` persistence hardening с `FT-010` seller rename behavior, не вводя второй rename policy и не размывая owner boundary `catalog`.
- Public browse, seller access resolution, and admin provisioning contracts не получили нового semantic drift от этой правки.

## Architectural concerns
- Mapping сохранен на application boundary, а не размазан по HTTP/runtime contours, что соответствует slice layering.
- Repo-local runtime helper теперь повторяет тот же invariant, поэтому checked-in mounted behavior не расходится с canonical persistence boundary в этой rename ветке.

## State/data consistency concerns
- Конфликтный rename fail-closed и сохраняет оба shop records без unintended mutation.
- Existing rename allowance semantics (`first free`, then manual paid review marker) остаются активными и проверены рядом с новым conflict path.

## Operational concerns
- Opaque `500` risk для rename collision устранен: mounted runtime now returns controlled `409` envelope.
- Targeted tests снижают риск regressions, где future persistence-boundary changes снова начнут протекать raw errors на seller path.

## Future maintenance cost
- Стоимость сопровождения снизилась: один и тот же durable uniqueness invariant теперь имеет согласованную business-surface semantics на provisioning и rename путях.

## How this could still be wrong
- Если product later решит разрешить same-seller duplicate shop names через иной identity rule, текущий `409` contract придется пересмотреть вместе со schema invariant.
- Этот pass не означает, что весь `FT-011` substantively closed; restart-safe canonical storefront resolution все еще требует последующего финального verify/manual smoke.

## Counterproposal / escalation path
- Follow-up/escalation по этой задаче не требуется.
- Продолжать normal loop через последующие `FT-011` durability/runtime closure tasks, особенно manual `provision -> restart/reset -> /shops/:shopId` smoke.
