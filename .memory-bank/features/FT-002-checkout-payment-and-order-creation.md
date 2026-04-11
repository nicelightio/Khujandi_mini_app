---
description: Feature C4 L3 для checkout, Telegram auth и paid-only order creation.
status: active
---
# FT-002 Checkout Payment And Order Creation

## REQs

- `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`
- `REQ-022`

## Current implementation state

- `TASK-FT002-01` completed the docs-first freeze for Telegram auth, session policy, and trusted payment confirmation boundaries.
- `TASK-FT002-02` completed the backend `checkout-payment` scaffold, Prisma baseline, and backend test skeleton.
- `TASK-FT002-03` completed the frontend `checkout-payment` scaffold and checkout route shell.
- `TASK-FT002-04` completed and verified backend Telegram auth validation, `auth_date` TTL enforcement, replay protection, and HttpOnly cookie session issuance.
- `TASK-FT002-05` completed and verified trusted payment finalization, provider/source verification, and idempotent paid-only order creation.
- `TASK-FT002-06` completed and verified retry-safe failed, canceled, and timeout payment handling without order side effects.
- `TASK-FT002-07` completed the frontend checkout route shell and repo-local success/retry UX smoke, but the checked-in frontend still defaults to a local stub API instead of a mounted backend checkout/auth runtime.
- `TASK-FT002-08` completed repo-local verification/docs sync for `FT-002`, but end-to-end runtime closure remains open because the checked-in dev/deploy runtime still does not mount the real customer-facing checkout/auth HTTP path used by the shared frontend contour.
- Current effective state: backend/domain logic is largely implemented, while the checked-in customer-facing checkout runtime remains only partially integrated.

## Use cases

- Клиент проходит Telegram auth на границе checkout.
- Система инициирует оплату у локального провайдера.
- После подтвержденного success создается заказ со статусом `CREATED`.

## Acceptance criteria

- `POST /auth/telegram` принимает raw `initData` string, валидирует `initData` и `auth_date` на backend, включая `secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)` и проверочный `HMAC_SHA256(key=secret_key, message=data_check_string)`; `auth_date` старше 10 минут отклоняется.
- `/auth/telegram` имеет replay guard для повторного использования того же `initData` в пределах TTL.
- Payment success становится trusted только после server-side проверки подлинности provider callback или эквивалентного provider status confirmation.
- Успешная оплата создает один заказ с `payment_status = PAID`.
- Payment error/timeout не создает запись в `orders`.
- Клиент получает retry UX при неуспешной оплате.
- Client-only payment UX signals (`invoiceClosed` и аналоги) не являются основанием для создания заказа.
- Если используется Telegram/Bot payment transport, webhook/update проходит `secret_token`/source verification и идемпотентную обработку до domain side effects.
- Session transport policy и CSRF/XSS trade-offs для Mini App auth explicitly documented до реализации.
- Telegram-sensitive verify baseline фиксируется через runtime contract/runbook; для `checkout-payment` в рамках `FT-002` это означает mock/runtime contract tests и transport verification, а real Mini App runtime evidence для customer-facing checkout UI закрывается в `FT-009`.

## Edge cases & failure modes

- Нельзя повторным callback-ом создать второй заказ для той же успешной оплаты.
- Callback/confirmation без trusted provider verification не должен создавать заказ.
- Просроченный или неверно подписанный `initData` должен отклоняться.
- Ошибка payment provider должна возвращать контролируемый error contract.
- Empty/missing `initData` в unsupported launch mode должен приводить к controlled auth recovery UX, а не к неявному обходу trust boundary.

## Constraints / invariants

- Нет заказа без подтвержденной оплаты.
- `initDataUnsafe` не используется для доверенных решений.
- Payment callback требует authenticity verification и replay protection по `payment_provider_tx_id` или эквивалентному idempotency key.
- Payment finalization и order creation должны иметь DB-level uniqueness по trusted payment identity.

## Normative inputs

- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): Telegram auth boundary и `initData` validation.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation и anti-replay.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): session/storage policy и Telegram runtime boundary.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для feature verification.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md): Telegram-specific verification scope и evidence rules.

## Verification targets

- `POST /auth/telegram`
- `POST /orders/checkout`

## Test strategy pointers

- e2e: successful payment creates order.
- e2e: failed/timeout payment keeps order absent and offers retry.
- integration: idempotency and provider callback handling.
- unit: auth TTL/signature validation helpers.
- integration: command responses include `updated_at` and `revision` when needed for downstream polling.
- verify: Telegram auth/payment runtime contract tests и Telegram/Bot transport evidence, если такой transport используется; real Mini App runtime evidence для checkout UI закрывается в `FT-009`.

## Verification closure

- `REQ-004` has repo-local backend unit/integration coverage for raw `initData` HMAC validation, 10 minute freshness, replay rejection, and HttpOnly cookie transport metadata, but the checked-in frontend/runtime path is not yet mounted end-to-end.
- `REQ-005` has trusted paid checkout integration/unit coverage plus frontend checkout smoke around success UX, but the checked-in customer-facing flow is still stubbed/unmounted and therefore not yet verified as a real mounted runtime path.
- `REQ-006` has backend controlled error-contract coverage for `FAILED`, `CANCELED`, and `PENDING` payment outcomes plus frontend retry UX smoke, but the checked-in customer-facing flow is still stubbed/unmounted and therefore not yet verified end-to-end.
- `REQ-021` has provider/source verification and duplicate trusted payment idempotency coverage at repo-local backend level, but remains implementation-level until the real mounted checkout path replaces the stubbed frontend/runtime path.
- Shared `REQ-022/023` closure is no longer treated as complete from `FT-002`; the feature currently contributes implemented backend/session policy and repo-local evidence only.
