---
description: Implementation plan для FT-008 two-sided reviews and negative alerts.
status: active
---
# IMPL-FT-008

## Goal

Доставить `FT-008` как owning `reviews-feedback` slice: после `COMPLETED` клиент и курьер проходят bot-guided review flow со структурой `rating -> reason_code -> comment(optional)`, review write-path валидирует actor/direction и защищен от duplicate/replay submissions, а `rating <= 2` с любой стороны публикует `review.negative` и эскалирует alert активным администраторам через Telegram-бота.

## Current state

- Delivery lifecycle до `COMPLETED` уже реализован в `FT-005`, поэтому `FT-008` может опираться на существующий order status contract как upstream prerequisite для activation gate review flow.
- В репозитории уже есть базовые Telegram bot integration primitives для assignment/tracking, но owning `reviews-feedback` slice, review persistence и bot review runtime harness пока отсутствуют.
- `FT-007` декомпозирован отдельно для admin access/security; `FT-008` не должен затягивать в себя admin auth/session ownership, но должен переиспользовать существующий или явно зафиксированный recipient boundary для negative alerts.

## REQs

- `REQ-013`
- `REQ-014`

## Normative inputs

- [.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md](../../features/FT-008-two-sided-reviews-and-negative-alerts.md): acceptance criteria, edge cases и scope boundary.
- [.memory-bank/epics/EP-004-reviews-and-alerts.md](../../epics/EP-004-reviews-and-alerts.md): parent epic success criteria и alert expectations.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-013`, `REQ-014` и RTM.
- [.memory-bank/contracts/telegram-bot-contract.md](../../contracts/telegram-bot-contract.md): review payload baseline, bot ingress security и `review.negative` fan-out semantics.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../../runbooks/manual-refund-and-negative-alerts.md): operational response to `review.negative` и duplicate/noise handling.
- [.memory-bank/invariants.md](../../invariants.md): low-rating alert invariant и auth/write protections.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../architecture/events-polling-and-bot-runtime.md): runtime ownership `review.created` / `review.negative`, duplicate-safe bot delivery и fan-out exception.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): ownership `reviews` model и negative alert semantics.
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md): `COMPLETED` gate как prerequisite для review activation.
- [.memory-bank/testing/index.md](../../testing/index.md): two-sided bot review и negative alert verification baseline.

## Constraints

- Review flow активируется только после `COMPLETED`; review submission для незавершенного заказа запрещен.
- Reviews уже двусторонние в MVP: и клиент, и курьер должны иметь собственный structured flow.
- Structured payload обязан включать `rating` и `reason_code`; `comment` остается optional, а direction/order context должен оставаться явным в persistence boundary.
- Duplicate/replay Telegram deliveries не должны создавать повторный review write или повторный negative alert fan-out; domain uniqueness и transport replay guard должны работать совместно.
- `review.negative` является explicit fan-out exception к default actor-targeted notification policy и должен уходить активным администраторам.
- `FT-008` не должен брать ownership над admin auth/session logic; recipient resolution для alert использует существующую или явно зафиксированную boundary.
- Bot transport остается runtime layer и не обходит server-side validation, idempotency и event semantics owning slice.

## Verification boundary

- `TASK-FT008-01` владеет docs-first freeze для review payload/routing, duplicate-safety и fan-out semantics.
- `TASK-FT008-05` владеет runtime closure для `review.negative` publication и active-admin targeting.
- `TASK-FT008-07` владеет final repo-local verification, RTM promotion и feature-level closure по `REQ-013` / `REQ-014`.

## Steps

1. Freeze docs-first review payload/routing policy, `COMPLETED` gate, duplicate-safety boundary и verify ownership для `FT-008`.
2. Scaffold backend `reviews-feedback` slice, persistence touchpoints и backend test harness без выноса review semantics в `shared`.
3. Scaffold Telegram bot review-stepper and alert harness, переиспользуя existing bot integration patterns без premature coupling к admin auth/session scope.
4. Реализовать backend review submission flow с completed-order validation, actor/direction ownership, structured payload persistence и duplicate guard.
5. Реализовать negative alert publication и Telegram fan-out к активным администраторам для low-rating reviews.
6. Подключить bot-guided client/courier review flow к backend command path с явными step transitions `rating -> reason_code -> comment(optional)` и controlled duplicate handling.
7. Добавить integration/e2e coverage, final verify evidence и docs sync по acceptance criteria `FT-008`, не размывая scope в отдельный admin UI.

## Expected touched files

- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-008.md`
- `.memory-bank/index.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/reviews-feedback/**/*`
- `backend/src/integrations/telegram-bot/**/*`
- `backend/src/shared/**/*`
- `tests/slices/reviews-feedback/**/*`

## Tests

- backend integration: review submission доступен только после `COMPLETED` и только для валидного actor/direction pair.
- backend integration: structured payload сохраняет `rating`, `reason_code`, optional `comment`, а duplicate/replay submission не создает второй review.
- backend integration: low rating (`<= 2`) публикует `review.negative` и инициирует alert fan-out активным администраторам ровно один раз.
- bot integration/contract: client and courier review steppers поддерживают последовательность `rating -> reason_code -> comment(optional)` и controlled duplicate handling.
- e2e: bot-guided client and courier review flows завершаются успешно для completed order.
- verify: acceptance criteria `FT-008` полностью закрыты repo-local evidence без расширения scope в admin auth UI.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for two-sided bot review flow
- verify negative alert and duplicate-safe bot/runtime evidence for `FT-008`

## UAT steps

1. Подготовить заказ в статусе `COMPLETED` и инициировать клиентский review flow через Telegram-бота.
2. Пройти шаги `rating -> reason_code -> comment(optional)` и убедиться, что review сохранен ровно один раз.
3. Повторить flow для курьера и убедиться, что сохраняется отдельный structured review для второй стороны.
4. Проверить, что попытка оставить review до `COMPLETED` возвращает controlled отказ без side effects.
5. Отправить low rating (`<= 2`) с каждой стороны и убедиться, что публикуется `review.negative`, а alert уходит активным администраторам.
6. Повторно доставить duplicate bot payload и убедиться, что review write и negative alert fan-out не дублируются.
