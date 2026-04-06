---
description: Feature C4 L3 для двусторонних отзывов через Telegram-бота и негативных alert-ов.
status: active
---
# FT-008 Two-Sided Reviews And Negative Alerts

## REQs

- `REQ-013`, `REQ-014`

## Use cases

- После `COMPLETED` клиент оставляет отзыв о курьере через Telegram-бота.
- После `COMPLETED` курьер оставляет отзыв о клиенте через Telegram-бота.
- Low rating с любой стороны создает негативный alert.

## Acceptance criteria

- Review flow активируется только после завершения заказа.
- Клиентский flow состоит из `rating -> reason_code -> comment(optional)`.
- Курьерский flow также поддерживает структурированный отзыв через Telegram-бота.
- Structured review write фиксирует `order_id`, направление (`client -> courier` или `courier -> client`), `rating`, `reason_code` и optional `comment`.
- `rating <= 2` с любой стороны порождает `review.negative` и alert активным администраторам.

## Edge cases & failure modes

- Нельзя отправить отзыв для незавершенного заказа.
- Duplicate/replay review submission не должна создавать повторную write-operation или повторную негативную эскалацию.

## Constraints / invariants

- Reviews являются двусторонними уже в MVP.
- Review write-path открывается только для заказа в terminal status `COMPLETED`; `DELIVERED`, `CANCELLED_*` и более ранние статусы не активируют review flow.
- Negative alert обязателен для обеих сторон review flow и является исключением, где fan-out идет шире default actor-targeted доставки.
- Review submission требует server-side idempotency/uniqueness guard: повторная bot delivery или replay одного и того же review payload не создает второй review write.
- Low rating публикует канонический `review.negative` и инициирует admin alert fan-out только один раз на уникальный persisted review.

## Review payload boundary

- Структурированный review payload MVP ограничен полями `rating`, `reason_code`, `comment(optional)` и контекстом направления/заказа.
- `rating` обязан быть в диапазоне `1..5`; `reason_code` обязателен для обеих сторон feedback loop.
- Ownership направления фиксирован как два допустимых pair'а: `client -> courier` и `courier -> client`; другие actor/direction combinations считаются invalid.
- Duplicate guard должен опираться одновременно на domain uniqueness review pair и transport replay protection для duplicate Telegram deliveries.

## Verification boundary

- `TASK-FT008-01` фиксирует docs/spec layer: `COMPLETED` activation gate, structured payload boundary, duplicate-safety semantics, `review.negative` fan-out rule и verify ownership.
- `TASK-FT008-05` закрыл runtime alert publication и active-admin fan-out без переноса admin auth/session ownership в `FT-008`; duplicate replay остается side-effect free и не повторяет escalation.
- `TASK-FT008-06` закрыл bot-guided wiring: обе стороны feedback loop проходят шаги `rating -> reason_code -> comment(optional)`, а финальный submit остается внутри owning backend path.
- `TASK-FT008-07` закрыл final repo-local verification/docs sync: two-sided bot review evidence, duplicate-safe submission, low-rating alert fan-out и RTM closure.

## Closure evidence

- Repo-local integration coverage подтверждает bot-guided review flow для обеих сторон feedback loop через owning `reviews-feedback` module/controller path.
- Repo-local evidence подтверждает `review.negative` publication и active-admin fan-out для обеих сторон low-rating flow.
- RTM closure для `REQ-013` и `REQ-014` допустима только вместе с duplicate-safe final-submit evidence и passing quality gates.

## Normative inputs

- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): bot review flow и alert delivery contract.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../runbooks/manual-refund-and-negative-alerts.md): operational reaction to `review.negative`.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для двусторонних review flows.

## Test strategy pointers

- e2e: client and courier bot review flows.
- integration: low-rating alert generation, reason_code validation, review persistence, duplicate/replay protection.
