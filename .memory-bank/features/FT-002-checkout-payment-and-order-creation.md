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
- `TASK-FT002-07` completed the frontend checkout route shell and repo-local success/retry UX smoke; later `TASK-FT013-04` replaced its local stub API path with mounted Mini App auth/language/checkout runtime calls.
- `TASK-FT002-08` completed repo-local verification/docs sync for `FT-002`; `TASK-FT013-04` now mounts the customer-facing auth/checkout HTTP path, while paid `CREATED` persistence from a revalidated composition remains with later `FT-013` tasks.
- Current effective state: backend/domain auth/payment logic is implemented and the checked-in customer-facing runtime now reaches the real Mini App auth/session boundary plus repo-local paid `CREATED` order persistence through `FT-013`; fresh Android Telegram evidence is now advisory pre-release risk evidence rather than a repo-local closure blocker.
- The real customer-facing catalog/cart -> checkout handoff and mounted paid order workflow are now tracked in `FT-013`, which extends the user flow around this feature without moving auth/payment/order creation ownership out of `FT-002`.

## Use cases

- Клиент проходит Telegram auth на границе checkout.
- Система инициирует оплату у локального провайдера.
- После подтвержденного success создается заказ со статусом `CREATED`.

## Acceptance criteria

- `POST /auth/telegram` принимает raw `initData` string, валидирует `initData` и `auth_date` на backend, включая `secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)` и проверочный `HMAC_SHA256(key=secret_key, message=data_check_string)`; `auth_date` старше 10 минут отклоняется.
- `/auth/telegram` имеет replay guard для повторного использования того же `initData` в пределах TTL.
- Payment success становится trusted только после server-side проверки подлинности provider callback или эквивалентного provider status confirmation.
- Repo-local/e2e mock payment MAY satisfy provider confirmation only when selected server-side by `PAYMENT_PROVIDER=mock` plus explicit non-production/runtime guard; `DEBUG=true` / `__APP_DEBUG__` MAY expose UI/debug affordance but MUST NOT be the only trust gate.
- Успешная оплата создает один заказ с `payment_status = PAID`.
- Payment error/timeout не создает запись в `orders`.
- Клиент получает retry UX при неуспешной оплате.
- Client-only payment UX signals (`invoiceClosed` и аналоги) не являются основанием для создания заказа.
- First KISS mock-payment baseline requires only the successful paid outcome; mock failed and timeout/pending outcomes are planned/follow-up unless explicitly included in a future implementation task.
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
- Mock payment mode is a guarded payment-provider variant of `checkout-payment`, not a catalog/cart capability and not a shared payment business abstraction.

## Normative inputs

- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): Telegram auth boundary и `initData` validation.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation и anti-replay.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): session/storage policy и Telegram runtime boundary.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для feature verification.
- [.memory-bank/runbooks/e2e-mock-payment.md](../runbooks/e2e-mock-payment.md): repo-local/e2e mock payment mode, gates and evidence rules.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md): Telegram-specific verification scope и evidence rules.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): mounted customer workflow that consumes cart/order composition and uses this feature's auth/payment boundary.

## Verification targets

- `POST /auth/telegram`
- `POST /orders/checkout`

## Test strategy pointers

- e2e: successful payment creates order.
- e2e: failed/timeout payment keeps order absent and offers retry.
- e2e: guarded mock payment success creates exactly one paid `CREATED` order only when `PAYMENT_PROVIDER=mock` and non-production guard are active.
- negative: `DEBUG=true` without server-side mock provider gate does not create a trusted paid confirmation.
- integration: idempotency and provider callback handling.
- unit: auth TTL/signature validation helpers.
- integration: command responses include `updated_at` and `revision` when needed for downstream polling.
- verify: Telegram auth/payment runtime contract tests и Telegram/Bot transport evidence, если такой transport используется; real Mini App runtime evidence для checkout UI закрывается в `FT-009`.

## Verification closure

- `REQ-004` has repo-local backend unit/integration coverage for raw `initData` HMAC validation, 10 minute freshness, replay rejection, HttpOnly cookie transport metadata, and a mounted runtime path consumed by the checked-in checkout frontend API.
- `REQ-005` has trusted paid checkout integration/unit coverage plus mounted `FT-013` runtime coverage for revalidated composition -> paid `CREATED` order persistence; fresh Android Telegram checkout smoke is advisory pre-release evidence.
- `REQ-006` has backend controlled error-contract coverage for `FAILED`, `CANCELED`, `PENDING` and ambiguous payment outcomes plus mounted frontend retry/repair coverage; fresh Android Telegram retry/repair smoke is advisory pre-release evidence.
- `REQ-021` has provider/source verification, duplicate trusted payment idempotency and mounted `FT-013` runtime coverage proving duplicate confirmation reuses the existing paid order.
- Shared `REQ-022/023` closure is no longer treated as complete from `FT-002`; the feature currently contributes implemented backend/session policy and repo-local evidence only.
- `FT-013` is the explicit follow-on feature for turning this implemented boundary into the real customer-facing checkout workflow from catalog/cart selection through paid order creation.
