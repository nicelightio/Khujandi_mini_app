---
description: Implementation plan для FT-002 checkout payment and order creation.
status: active
---
# IMPL-FT-002

## Goal

Доставить `FT-002` как owning `checkout-payment` slice: Telegram auth на checkout boundary, trusted payment confirmation и создание заказа только после подтвержденной успешной оплаты без duplicate side effects.

## Current state

- `catalog` slice уже дает customer-facing browse baseline, поэтому `FT-002` должен добавить следующий vertical slice customer journey, а не переопределять existing catalog ownership.
- В проекте уже есть shell-level Telegram/shared primitives во frontend, но auth/payment contracts пока существуют только в spec layer.
- План intentionally начинается с docs/spec freeze для session transport policy, потому что acceptance criteria feature doc требует explicit documentation до runtime implementation.

## REQs

- `REQ-004`
- `REQ-005`
- `REQ-006`
- `REQ-021`
- `REQ-022`

## Normative inputs

- [.memory-bank/features/FT-002-checkout-payment-and-order-creation.md](../../features/FT-002-checkout-payment-and-order-creation.md): acceptance criteria, failure modes и verification targets.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../../contracts/telegram-mini-app-auth-contract.md): Telegram `initData` validation, TTL, replay guard и session issuance policy.
- [.memory-bank/contracts/payment-confirmation-contract.md](../../contracts/payment-confirmation-contract.md): trusted payment confirmation, idempotency и atomic order creation boundary.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic success criteria.
- [.memory-bank/invariants.md](../../invariants.md): no-order-without-paid, no-client-only-payment-signal и auth TTL invariants.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): slice/layer ownership and shared boundaries.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): payment identity persistence и DB-level uniqueness.
- [.memory-bank/guides/storage-and-state-implementation.md](../../guides/storage-and-state-implementation.md): cart/session storage policy и explicit payment persistence fields.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и Telegram-sensitive anti-cheat baseline.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../runbooks/telegram-mini-app-verification.md): Telegram-specific verify scopes for auth/payment; client-matrix ownership for customer-facing Mini App checkout UI is deferred to `FT-009`.

## Constraints

- Нет заказа без trusted successful payment.
- `POST /auth/telegram` принимает raw `initData` string и валидирует подпись/`auth_date` только на backend.
- Replay `initData` в пределах TTL должен блокироваться.
- Payment finalization и order creation требуют DB uniqueness по trusted payment identity и atomic write boundary.
- Session identifiers не должны попадать в `localStorage` или другой JS-readable persistent storage baseline.
- Client payment UX может показывать progress/retry, но не имеет права самостоятельно подтверждать успешную оплату.

## Steps

1. Freeze docs-first boundary для Telegram auth, session transport policy и trusted payment confirmation внутри `FT-002` implementation scope.
2. Scaffold backend `checkout-payment` slice, Prisma/payment/order baseline и тестовый каркас.
3. Scaffold frontend `checkout-payment` slice и checkout route/model shell с переиспользованием existing Telegram/shared runtime primitives.
4. Реализовать `POST /auth/telegram` с HMAC validation, TTL guard, replay protection и session issuance.
5. Реализовать trusted payment finalization path, idempotent callback/status confirmation и paid-only order creation.
6. Реализовать failed/timeout/cancelled payment handling с controlled error contract и retry semantics без order side effects.
7. Подключить Mini App checkout UX к auth/payment backend flow, явно исключив client-only order creation.
8. Добавить unit/integration/e2e coverage, repo-local auth/payment runtime verification и docs sync; real Mini App client-matrix evidence для checkout UI остается частью `FT-009`.

## Expected touched files

- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/tasks/backlog.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/shared/**/*`
- `tests/slices/checkout-payment/**/*`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/tests/slices/checkout-payment/**/*`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/telegram/**/*`
- `frontend/src/shared/state/**/*`

## Tests

- backend unit: `initData` signature/TTL helpers and replay guard primitives.
- backend integration: `POST /auth/telegram` success, invalid signature, expired payload, replay detection.
- backend integration: trusted payment callback/status confirmation, duplicate delivery idempotency and paid order creation.
- backend integration: failed/timeout payment keeps `orders` absent and returns controlled error contract.
- frontend UI/e2e: checkout happy path, payment failure retry UX, no client-only order creation.
- verify: Telegram auth/payment runtime contract tests and transport-specific evidence for auth/payment flow; real client-matrix evidence for checkout UI is covered by `FT-009`.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for `checkout-payment`
- auth/payment runtime contract verification per runbook; real Telegram client-matrix gate for checkout UI is deferred to `FT-009`

## UAT steps

1. Открыть Mini App checkout flow из customer-facing маршрута и убедиться, что raw Telegram `initData` идет только на `POST /auth/telegram`.
2. Проверить, что просроченный, битый и повторно использованный `initData` не выдает valid auth session.
3. Запустить успешный payment flow и убедиться, что создается один order со статусом `CREATED` и trusted payment markers.
4. Повторно доставить provider callback/status confirmation и убедиться, что второй order не появляется.
5. Спровоцировать failed/timeout/cancelled payment и убедиться, что order не создается, а клиент получает retry UX.
6. Если используется Telegram/Bot payment transport, проверить source verification (`secret_token` или эквивалент) и сохранить transport-level evidence; customer-facing Telegram client-matrix для checkout UI закрывается в `FT-009`.
