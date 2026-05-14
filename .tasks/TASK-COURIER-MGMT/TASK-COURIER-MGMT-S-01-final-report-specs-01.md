# TASK-COURIER-MGMT S-01: анализ spec/normative слоя

Роль: `SUBAGENT / explorer`
Дата: 2026-05-13
Scope: только чтение specs/docs и запись этого отчета.

## Краткий результат

В текущем normative слое уже есть значимый фундамент для управления курьерами, но он описан не как отдельный CRUD/management feature, а как часть delivery operations:

- `FT-016` задает courier availability, auto-offer participation, `rating_score`, operator panel и timeout-штраф.
- `FT-004` владеет assignment offer/claim semantics, включая активность/свободность курьера и штраф `rating_score -= 1` для personal offer timeout.
- `FT-005` владеет post-assignment lifecycle и operator/admin status controls.
- `FT-008` владеет reviews/negative alerts, но не описывает пересчет или ручную коррекцию репутации курьера.
- `FT-007/admin-access` владеет только login/password auth контуром admin-web и не должен становиться owner доменной логики курьеров.

Отдельных требований на добавление курьеров через `admin-web`, список/карточку курьеров, ручную правку кармы/репутации, блокировку/деактивацию курьера, историю ручных корректировок, RBAC для этих операций и API-контракт courier management сейчас нет. Это gap перед реализацией.

## Вероятный owning slice / contour / layers

Предварительная рекомендация subagent:

- Owning capability slice: вероятнее всего `delivery-assignment`, если функционал ограничен courier registry для offer/claim, availability, auto-offer eligibility и `rating_score`.
- Contour: `admin-web` как presentation для operator/admin/boss действий; `telegram-bot` остается courier self-service contour для availability/menu и не должен владеть admin CRUD.
- Touched layers будущей реализации: `presentation` (`admin-web`), `application`/`domain`/`infra` в `delivery-assignment`, плюс persistence.
- Consumed slices:
  - `admin-access`: session/RBAC only.
  - `delivery-tracking`: read-only признаки занятости/активных заказов для карточки курьера.
  - `reviews-feedback`: read-only reviews/negative alert history, если нужно показывать источники репутации.
- Shared extraction: не оправдана. Courier management несет бизнес-смысл delivery operations и не должен уходить в `shared`. Допустимы только существующие shared primitives: auth/RBAC helpers, db bootstrap, error/event primitives.

Если product intent шире, например "единый справочник всех пользователей и ролей" для courier/seller/client/admin, это уже не узкая delivery capability и требует отдельного spec/architecture решения orchestrator-а. В рамках текущего запроса безопаснее держать scope около `delivery-assignment`.

## Уже существующие требования и правила

### Глобальный product / requirements слой

- Product описывает роль `courier`: получает назначение, подтверждает заказ, меняет статусы доставки, оставляет отзыв о клиенте.
- Product описывает `operator`: мониторит заказы, получает alerts, управляет назначением/статусами и коммуникацией через бота.
- Product target flow: operator/admin видит заказы, auto-offer предлагает заказ активным свободным курьерам, первый successful claim переводит заказ в `ASSIGNED`.
- Product constraints: "Нет продвинутой BI/аналитики и авто-пересчета VIP/репутации".
- Requirements:
  - `REQ-007`: operator/admin или auto-offer инициирует предложение заказа курьеру; `ASSIGNED` только после atomic claim.
  - `REQ-035`: operator/admin panel показывает заказы, courier assignment/claim state и историю.
  - `REQ-036`: courier bot имеет active/stop-after-5-min/auto-offer participation; отсутствие принятия переводит заказ в `DELAYED`.
- Requirements out of scope: "Продвинутая BI-аналитика и автоматический пересчет VIP/репутации".

### FT-016 Operator Orders Monitoring And Courier Offer Flow

`FT-016` является самым близким feature-документом:

- Courier fields target: `is_active`, `accepting_orders_until`, `auto_offer_enabled`, `rating_score`.
- Active/free definition:
  - active: courier explicitly on work and not past stop-after-5-min window;
  - participates in auto-offer: toggle ON;
  - free: no current order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.
- Personal offer timeout decreases courier `rating_score` by 1; broadcast timeout does not penalize a specific courier.
- Scope boundary: `FT-004` owns assignment offer/claim, `FT-005` owns lifecycle/history/events, `FT-007` owns web auth/session.

Это покрывает часть "кармы" только как simple `rating_score` и только один автоматический decrement-сценарий. Ручная правка `rating_score` через admin-web не специфицирована.

### FT-004 Courier Assignment

- Владеет `CREATED|DELAYED -> ASSIGNED`, offer/claim semantics и validation target courier active/free.
- Acceptance: personal offer timeout decrements `rating_score` by 1; duplicate/retry must not create repeated rating/delayed side effects.
- Assignment write flow использует единый error contract и audit trail.

Важно: `rating_score` здесь привязан к assignment timeout, а не к общей репутационной модели.

### FT-005 Delivery Tracking

- Владеет status lifecycle `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Operator/admin может выполнять разрешенные status changes с confirmation, history/audit actor data и `409` на invalid transitions.
- Для courier management это источник read-only статуса занятости и истории delivery performance, но не owner профиля курьера или `rating_score`.

### FT-008 Reviews Feedback

- Двусторонние отзывы после `COMPLETED`.
- Low rating `<= 2` публикует `review.negative` и fan-out active admins.
- Нет требования, что review rating автоматически меняет courier `rating_score`, VIP или reputation. Наоборот, auto-recalc репутации/VIP явно вне MVP.

### Contracts / states

- `operator-delivery-ops-contract.md` закрепляет read model operator panel, manual offer, auto-offer, claim, timeout, `rating_score -= 1` для personal offer timeout.
- `telegram-bot-contract.md` закрепляет courier menu fields: `is_active`, `accepting_orders_until`, `auto_offer_enabled`, `rating_score`; bot не обходит server-side state machine.
- `states/order-lifecycle.md` закрепляет same timeout/rating rule и ownership boundaries.
- `admin-auth-contract.md` описывает только auth/session/provisioning admin accounts; courier provisioning не описан.

## Gaps перед реализацией courier management

1. Нет feature spec для "Courier Management" как admin-web capability.

Нужен новый FT или расширение `FT-016`, где будут явно зафиксированы:

- кто может добавлять курьера (`operator`, `admin`, `boss`);
- какие поля минимального профиля курьера обязательны;
- как связывать курьера с Telegram identity/chat id;
- может ли courier быть создан без Telegram binding;
- что значит active/enabled/blocked/deleted для курьера;
- как это влияет на offer eligibility.

2. Нет public/admin API contract.

Не описаны endpoints/read models:

- список курьеров;
- создать курьера;
- посмотреть карточку;
- изменить `rating_score`/карму;
- включить/выключить availability/eligibility админом;
- audit/history manual adjustments.

3. Нет нормативной модели репутации.

Есть только:

- glossary `VIP`;
- old narrative docs: "Репутация и VIP-статусы назначаются вручную";
- действующий Memory Bank: auto-recalc VIP/reputation out of scope;
- `rating_score` в delivery assignment timeout semantics.

Не определено:

- является ли "карма" тем же самым, что `rating_score`;
- диапазон, default value, min/max, sign, отображение и бизнес-смысл;
- ручная корректировка additive delta или absolute set;
- требуется ли reason/comment;
- влияет ли значение на sorting/auto-offer priority или только informational;
- должны ли reviews менять score автоматически;
- как восстановить score после ошибочного штрафа.

4. Нет data ownership для courier profile.

`data-boundaries-and-persistence.md` перечисляет ownership `delivery-assignment` для order assignment touchpoints и events, но не называет courier profile/user fields как owned data. FT-016 планировал user/courier fields, однако normative data boundaries не закрепили, что именно `delivery-assignment` владеет courier operational profile.

5. Нет RBAC matrix для courier management.

Сейчас есть:

- `admin` включает operator capabilities;
- `boss` admin-equivalent для admin-web capability checks и boss-only provisioning там, где явно указано;
- `operator` manager role для delivery operations.

Но не решено:

- может ли `operator` создавать курьеров;
- может ли `operator` менять `rating_score`;
- reserved ли create/delete/block для `admin`/`boss`;
- нужна ли отдельная audit severity для ручной репутационной операции.

6. Нет policy по destructive/soft delete/deactivation courier.

Для catalog destructive delete запрещен, но для couriers ничего не сказано. Перед реализацией нужно решить:

- курьер удаляется, архивируется, блокируется или становится `is_active=false`;
- можно ли деактивировать курьера с активным заказом;
- что делать с pending offers при блокировке/deactivation.

7. Нет связи с reviews.

Если UI должен показывать "репутацию" из отзывов, нужны правила read model:

- средний рейтинг по courier reviews;
- count reviews;
- negative review count;
- связь этих значений с manual `rating_score`;
- explicit statement, что reviews не меняют score автоматически, если таков MVP baseline.

8. Нет event/audit contract для courier profile writes.

Глобально все значимые write-операции создают event/audit где нужно. Для courier management не определены event types, например:

- `courier.created`;
- `courier.updated`;
- `courier.rating_adjusted`;
- `courier.disabled`;
- `courier.telegram_bound`.

Также не определен audit payload и sensitive fields policy.

9. Нет testing/verification targets.

Нужны quality gates:

- RBAC create/update/rating-adjust forbidden/allowed cases;
- no offer to disabled/inactive/unbound courier;
- manual score change writes audit/event and requires reason;
- active order safety;
- admin-web protected route smoke.

## Возможные противоречия / drift

1. "Репутация/VIP назначаются вручную" в старых narrative docs vs "автоматический пересчет репутации/VIP out of scope" в PRD/Memory Bank.

Это не прямой конфликт, если понимать так:

- ручное назначение/корректировка может быть допустимой product capability;
- автоматический пересчет по BI/reviews/формулам не входит в MVP.

Но в Memory Bank нет активного feature/contract, который разрешает ручную корректировку курьерской репутации через admin-web. Реализация без spec update будет домыслом.

2. `rating_score` уже используется как courier score, но не определена "карма".

Если "карма" будет просто UI label для `rating_score`, это нужно явно закрепить. Если "карма" отдельна от `rating_score`, потребуется новая persistence модель и boundary, иначе появится semantic drift.

3. `FT-016` ставит `rating_score -= 1` за personal offer timeout, а `FT-008` low rating только alerts.

Если будущая фича ожидает, что негативные отзывы ухудшают карму, это противоречит текущему MVP direction: auto-recalc reputation/VIP out of scope и low rating сейчас только alert/event.

4. Admin-web route ownership может быть спутан с `admin-access`.

`admin-access` владеет auth/session, не курьерами. Courier management через admin-web не должен становиться `admin-access` domain.

5. Возможная role ambiguity: `operator`, `admin`, `boss`, historical `manager`.

Glossary говорит, что business label `manager` соответствует `operator`, а `boss` admin-equivalent для admin-web capabilities. Future spec должен явно мапить роли для courier CRUD/score operations, иначе повторится drift вокруг role-policy.

## Рекомендуемая spec-first декомпозиция

Перед кодом нужен docs-first шаг. Минимально достаточный вариант:

1. Создать новую feature spec, например `FT-019-admin-courier-management.md`, или расширить `FT-016`, если orchestrator решит, что это часть operator delivery ops.
2. Обновить `requirements.md` новым REQ на courier management или расширить `REQ-036`, если scope только operational courier profile/availability.
3. Добавить contract, например `contracts/admin-courier-management-contract.md` или расширить `operator-delivery-ops-contract.md`.
4. Обновить `data-boundaries-and-persistence.md`: закрепить ownership courier operational profile за `delivery-assignment`.
5. Обновить `glossary.md`: определить "карма" как `rating_score` или отдельную сущность.
6. Добавить testing targets в `.memory-bank/testing/index.md`.

## Предложение scope для первого MVP increment

Если нужно сохранить KISS и не расширять продукт сверх текущих specs:

- Admin-web список курьеров: имя/Telegram identity/chat binding, availability fields, active/free computed state, `rating_score`.
- Создание курьера: минимальная запись с Telegram identity/bot chat binding или explicit pending-binding state.
- Ручная корректировка `rating_score`: delta или set только с обязательной причиной, audit/event.
- Деактивация без delete: forbidden если есть active order; pending offers cancelled/expired только если явно специфицировано.
- Reviews показывать read-only summary, не менять `rating_score` автоматически.

Out of first increment:

- авто-пересчет репутации/VIP;
- dispatch optimization по рейтингу;
- BI dashboards;
- удаление courier history;
- CRM/chat UI в admin-web.

## Files inspected

- `AGENTS.md`
- `doc/ARCHITECTURE.md`
- `doc/PRD.md`
- `doc/PROJECT_SPECIFICATION.md`
- `doc/BRIEF_EXT.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/index.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/adrs/ADR-003-separate-auth-contours.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md`

## Checks run

- `rg --files` / `find .memory-bank -maxdepth 3 -type f`
- `rg -n "courier|курьер|delivery|достав|karma|карм|reput|репута|operator|admin-web|..." .memory-bank doc/ARCHITECTURE.md AGENTS.md`
- `rg -n "rating_score|karma|карм|reputation|репута|VIP|..." .memory-bank doc`
- Targeted `sed -n` reads for the files listed above.

No code/build/test gates were run because task scope is docs/spec exploration only.

## Blockers / risks

- Реализация добавления курьеров и ручной кармы без spec update будет нарушать spec-driven policy: поведение не зафиксировано в active Memory Bank.
- Главный semantic risk: "карма", `rating_score`, review rating и VIP могут быть смешаны без явного glossary/contract решения.
- RBAC risk: неясно, кто имеет право создавать курьеров и менять score.
- Data ownership risk: courier operational profile не закреплен в data boundaries как owned by `delivery-assignment`.
- Audit/event risk: manual score/profile changes являются значимыми write-операциями, но event/audit types не определены.

## Recommendation

Не переходить сразу к реализации. Сначала поручить `spec-writer` узко дополнить normative layer для courier management:

- закрепить owner: `delivery-assignment` + `admin-web` contour;
- определить "карма" как `rating_score` или отдельный field;
- описать create/list/update/rating-adjust/deactivate contracts;
- зафиксировать RBAC и audit/event semantics;
- явно отделить manual score adjustment от out-of-scope auto-reputation/VIP recalculation.

После этого реализация может идти малыми задачами: persistence/contract -> backend application/API -> admin-web read/list -> create/update -> score adjustment audit -> verification.
