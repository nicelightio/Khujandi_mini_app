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
- `rating <= 2` с любой стороны порождает `review.negative` и alert активным администраторам.

## Edge cases & failure modes

- Нельзя отправить отзыв для незавершенного заказа.
- Duplicate/replay review submission не должна создавать повторную write-operation или повторную негативную эскалацию.

## Constraints / invariants

- Reviews являются двусторонними уже в MVP.
- Negative alert обязателен для обеих сторон review flow и является исключением, где fan-out идет шире default actor-targeted доставки.
- Review submission требует idempotency/uniqueness guard against duplicate bot delivery.

## Normative inputs

- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): bot review flow и alert delivery contract.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../runbooks/manual-refund-and-negative-alerts.md): operational reaction to `review.negative`.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для двусторонних review flows.

## Test strategy pointers

- e2e: client and courier bot review flows.
- integration: low-rating alert generation, reason_code validation, review persistence, duplicate/replay protection.
