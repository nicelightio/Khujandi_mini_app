# TASK-COURIER-MGMT S-01 code reality report

ROLE: SUBAGENT
TYPE: explorer

## Задача

Исследовать checked-in code reality для курьеров: Prisma schema/models/seed, backend `delivery-assignment` / `delivery-tracking` / `admin-access` / runtime routes, admin-web UI, tests. Цель: понять, какие сущности и API уже есть для courier, availability, karma/reputation, admin roles, и где минимально добавлять создание/просмотр/изменение кармы.

## Spec/context baseline

- Owning capability slices: `delivery-assignment` для courier availability, offers, claim, timeout penalty; `delivery-tracking` только для post-assignment статусов; `admin-access` только для web-admin session/roles.
- Owning contour для будущего CRUD/просмотра в админке: `admin-web`, backend runtime/admin API.
- Touched layers для будущей реализации: presentation + application/infra внутри `delivery-assignment`; admin-web presentation/API. `admin-access` лучше только потреблять как auth/RBAC.
- Shared extraction не оправдан: courier availability/karma не является общим primitive, это delivery operations domain state.

## Короткий вывод

Checked-in код уже имеет courier как `User` с ролью `COURIER`, availability-поля и `ratingScore`. Отдельных моделей `Courier`, `Karma`, `Reputation`, отдельного admin courier management API или UI нет.

Минимальное место для добавления создания/просмотра/изменения кармы:

1. backend `delivery-assignment` application/domain/infra: добавить узкие methods для list/create/update courier profile или хотя бы list/update `ratingScore`;
2. runtime routes: добавить admin-protected endpoints рядом с `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`;
3. admin-web: расширить `frontend/src/admin/api/admin-assignment-api.ts` или создать узкий courier-management API в admin contour; UI лучше не встраивать через prompt, а добавить секцию/панель списка курьеров в существующую operator delivery страницу или отдельный protected route;
4. tests: backend delivery-assignment unit/integration/runtime + admin API/route tests.

## Checked-in data model

### Courier identity

- `backend/prisma/schema.prisma:41` содержит `UserRole` с `COURIER`.
- `backend/prisma/schema.prisma:287` модель `User` хранит courier как обычного user:
  - `telegramId`, `role`, `name`, `username`, `language`;
  - `isActive`;
  - `acceptingOrdersUntil`;
  - `autoOfferEnabled`;
  - `ratingScore`.
- `backend/prisma/schema.prisma:178` `Order.courierId` это `String?`, без FK relation на `User`.
- `backend/prisma/schema.prisma:242` `AssignmentOffer.targetCourierId` связан с `User`.
- `backend/prisma/schema.prisma:306` `Review` хранит reviews, target role может быть `COURIER`, но текущая operational karma в assignment flow использует именно `User.ratingScore`, а не aggregate из reviews.

### Availability / reputation fields

- Availability уже durable в Prisma: `User.isActive`, `User.acceptingOrdersUntil`, `User.autoOfferEnabled`.
- Reputation/karma checked-in поле: `User.ratingScore Int @default(0)`.
- Нет истории изменения `ratingScore`, нет отдельного audit/event для manual karma adjustment, нет reason/comment полей.

### Migrations/seeds

- `backend/prisma/migrations/20260509173000_add_ft016_assignment_offer_compatibility/migration.sql` добавляет `acceptingOrdersUntil`, `autoOfferEnabled`, `ratingScore`, `AssignmentOffer`.
- Checked-in seed-файл `backend/prisma/seeds/catalog-runtime-baseline.json` catalog-only; courier/admin seed для Prisma не найден.
- Dev runtime seed есть в коде: `backend/src/dev-runtime/order-ops-runtime.ts:90` добавляет `courier-7`, `courier-8`; availability state создается отдельно с `ratingScore: 0` в `backend/src/dev-runtime/order-ops-runtime.ts:302`.

## Backend delivery-assignment reality

### Domain/application

- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts` определяет `DeliveryAssignmentCourierRecord` и `DeliveryAssignmentCourierAvailabilityRecord` с `ratingScore`.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:50` реализует `startCourierWork`.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:66` реализует stop-after-5-min.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:92` переключает `autoOfferEnabled`.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:113` возвращает availability одного courier.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:279` создает manual offer, проверяя active/free.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:352` создает broadcast offers только для active/free/autoOffer couriers.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:453` запускает timeout evaluator.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:617` считает availability: active = `isActive && (acceptingOrdersUntil == null || acceptingOrdersUntil > now)`, free = no busy order.

### Prisma infra

- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:311` select courier fields includes `ratingScore`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:374` ищет auto-offer candidates по `role=COURIER`, `isActive=true`, `autoOfferEnabled=true`, cutoff.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:405`, `:424`, `:446` пишут availability flags, но не делают manual karma set.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:999` penalizes personal timeout with `ratingScore decrement: 1`.

### Runtime routes

- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:39` имеет protected read endpoint `GET /api/v1/admin/operator/delivery/orders`.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:41` имеет protected timeout tick endpoint.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:42` имеет `POST /api/v1/admin/orders/:id/auto-offers`.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:43` имеет `POST /api/v1/admin/orders/:id/assignment-offers`.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:45` имеет explicit assignment override.
- Нет checked-in route для:
  - `GET /api/v1/admin/couriers`;
  - `POST /api/v1/admin/couriers`;
  - `PATCH /api/v1/admin/couriers/:id/karma`;
  - `PATCH /api/v1/admin/couriers/:id/availability`.

### Dev runtime read model

- `backend/src/dev-runtime/order-ops-runtime.ts:524` `listOperatorDeliveryOrders` возвращает orders window и courier cell только в контексте заказа.
- `backend/src/dev-runtime/order-ops-runtime.ts:569` courier object в read model: marker + current `{ id, name, telegramId }`.
- `ratingScore`, `autoOfferEnabled`, `acceptingOrdersUntil`, `free/active` в operator orders payload не выходят.

## Backend delivery-tracking reality

- `delivery-tracking` знает только `Order.courierId` и actor role для status transitions.
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts` разрешает courier transitions и operator/admin completion, но не читает/пишет courier availability или `ratingScore`.
- `delivery-tracking` не подходящее место для courier management/karma, кроме отображения courier name/id в history/read model.

## Admin-access / roles reality

- Prisma enum `UserRole` содержит `BOSS`, `MANAGER`, `OPERATOR`, `ADMIN`, `SELLER`, `COURIER`, `CLIENT`.
- `backend/src/slices/admin-access/domain/admin-access.types.ts:4` `AdminAccessRole` в application layer сейчас только `"boss" | "manager" | "admin"`.
- `backend/src/dev-runtime/admin-access-runtime.ts:11` runtime admin account role type only `"BOSS" | "MANAGER" | "ADMIN"`.
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:21` мапит `manager` в `operator` для status commands; `:29` делает то же для assignment offer roles.
- Следствие: отдельный `OPERATOR` есть в Prisma/global role enum, но admin login/session runtime фактически не имеет provisioned `operator` account role; operator capability потребляется через `manager` mapping или `admin/boss`.

## Admin-web UI reality

### API client

- `frontend/src/admin/api/admin-assignment-api.ts:24` courier contract в operator orders содержит только marker/current `{ id, name, telegramId }`.
- `frontend/src/admin/api/admin-assignment-api.ts:149` API methods: list operator delivery orders, manual targeted offer, broadcast offer, operator status update.
- Нет API methods для courier list/create/update/rating.

### Route/UI

- `frontend/src/admin/routes/admin-assignment-route.tsx:115` targeted offer получает courier id через `window.prompt("ID курьера...")`.
- `frontend/src/admin/routes/admin-assignment-route.tsx:129` отправляет manual offer по введенному courier id.
- `frontend/src/admin/routes/admin-assignment-route.tsx:192` отправляет broadcast offer.
- `frontend/src/admin/routes/admin-assignment-route.tsx:255` отправляет status command после confirm.
- `frontend/src/admin/components/admin-assignment-page.tsx` показывает courier column only per order. Нет списка курьеров, карточки courier profile, `ratingScore`, availability toggles или create courier form.

## Telegram bot / courier harness

- `backend/src/integrations/telegram-bot/telegram-bot-courier-availability.harness.ts` строит меню `Курьер`, callbacks для start/stop/auto-offer.
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment-claim.harness.ts` строит claim callback/prompt.
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts` строит status action callbacks.
- Это harness/presentation adapter, не admin management API.

## Tests reality

### Backend delivery-assignment

- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts` покрывает availability, auto-offer eligibility, direct override, offer flows.
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts` проверяет Prisma field selects/writes for availability and rating preservation.
- `tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts` проверяет repeat/expire, `DELAYED`, operator alert, personal timeout penalty `ratingScore -= 1`, broadcast no-penalty.
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts` проверяет protected runtime endpoints for manual/broadcast offers and no direct assignment default.
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts` проверяет atomic claim and side effects.

### Backend delivery-tracking

- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` проверяет admin-protected operator read model/status endpoint and v2 status flow.

### Frontend admin

- `frontend/src/tests/admin/admin-assignment-api.spec.ts` проверяет existing assignment API methods only.
- `frontend/src/tests/admin/admin-assignment-route.spec.tsx` проверяет operator orders table, manual/broadcast offer buttons, prompt-based courier id input, status confirm.
- `frontend/src/tests/admin/admin-assignment-view-model.spec.ts` проверяет severity/sorting/action cells, но не courier list/karma.

## Drift / gaps relevant to courier management

1. Spec говорит о courier `rating_score`; code использует camelCase `ratingScore` в Prisma model и TypeScript. Это нормально для implementation reality, но future API naming надо решить явно.
2. `ratingScore` уже уменьшается на timeout, но нет endpoint/UI для просмотра и ручного изменения.
3. Нет audit/event для manual rating adjustment. Если изменение кармы будет operator-visible write, это нужно добавить минимально в `delivery-assignment`, не в `admin-access`.
4. Admin roles split неполный: `OPERATOR` есть в global `UserRole`, но admin session layer role union не включает `"operator"`. Runtime дает operator capability через `manager -> operator` mapping.
5. Existing admin assignment UI использует `prompt` для courier id, значит создание нормального courier selector/list является заметным UX debt.
6. Runtime storage для couriers split: base user data живет в checkoutPaymentState users, availability/rating в operational runtime map. Для production Prisma это единая `User` table, но runtime adapter потребует отдельного extension.

## Минимальная рекомендация для следующего implementer

Не создавать отдельный `Courier` model на первом шаге. Использовать existing `User` с `role=COURIER` и `ratingScore`.

Предлагаемый минимальный slice-local план:

1. В `delivery-assignment` добавить repository/service methods:
   - list couriers with `{ id, telegramId, name, username?, isActive, acceptingOrdersUntil, autoOfferEnabled, ratingScore, active, free }`;
   - create courier by Telegram identity/minimal display fields, role forced to `COURIER`;
   - adjust/set `ratingScore` with actor + reason.
2. В runtime добавить admin-protected endpoints рядом с existing operator routes:
   - `GET /api/v1/admin/couriers`;
   - `POST /api/v1/admin/couriers`;
   - `PATCH /api/v1/admin/couriers/:courierId/rating`.
3. В admin-web добавить courier list/selector:
   - минимум: в operator delivery page показать список курьеров и использовать selector вместо prompt для targeted offer;
   - если scope позволяет: отдельный protected route `/admin/couriers`.
4. Для manual rating change добавить audit/event. Если не хочется расширять schema, можно reuse `Event` with type `courier.rating_adjusted` and payload, но это публично-контрактное решение должен принять orchestrator/spec-writer.
5. Не трогать `delivery-tracking` кроме read-only отображения courier identity, если понадобится.

## Files inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `doc/ARCHITECTURE.md`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260509173000_add_ft016_assignment_offer_compatibility/migration.sql`
- `backend/prisma/migrations/20260509120000_add_ft016_lifecycle_role_compatibility/migration.sql`
- `backend/prisma/migrations/20260510120000_add_order_status_history_actor_metadata/migration.sql`
- `backend/prisma/seeds/catalog-runtime-baseline.json`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`
- `backend/src/slices/delivery-assignment/presentation/delivery-assignment.module.ts`
- `backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts`
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository.ts`
- `backend/src/slices/delivery-tracking/presentation/delivery-tracking.controller.ts`
- `backend/src/slices/admin-access/domain/admin-access.types.ts`
- `backend/src/slices/admin-access/application/admin-access.service.ts`
- `backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository.ts`
- `backend/src/slices/admin-access/presentation/admin-auth-http.ts`
- `backend/src/dev-runtime/admin-access-runtime.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-courier-availability.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment-claim.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`
- `frontend/src/admin/api/admin-assignment-api.ts`
- `frontend/src/admin/model/admin-assignment-view-model.ts`
- `frontend/src/admin/routes/admin-assignment-route.tsx`
- `frontend/src/admin/components/admin-assignment-page.tsx`
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts`
- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`
- `frontend/src/tests/admin/admin-assignment-api.spec.ts`
- `frontend/src/tests/admin/admin-assignment-route.spec.tsx`
- `frontend/src/tests/admin/admin-assignment-view-model.spec.ts`

## Files changed

- `.tasks/TASK-COURIER-MGMT/TASK-COURIER-MGMT-S-01-final-report-code-01.md`

## Checks run

- Read-only code/spec inspection with `rg`, `find`, `sed`, `nl`.
- No tests run; task scope was exploration/report only.

## Blockers/risks

- Product/API contract for manual karma changes is not specified in loaded specs: set vs delta, allowed roles, audit/event shape, negative bounds, reason requiredness.
- Creating couriers through admin-web may cross admin-access/provisioning policy if it is treated as account provisioning; if it is only Telegram courier user creation, keep it in `delivery-assignment`.
- Runtime and Prisma storage differ enough that implementer must update both Prisma repository and `order-ops-runtime.ts` adapter.

## Recommendation

Proceed with a spec-writer/orchestrator decision for the exact courier management API contract, then implement narrowly in `delivery-assignment` + `admin-web`. Reuse `User.ratingScore`; do not introduce a separate courier/karma table unless audit history must be durable as first-class domain data.
