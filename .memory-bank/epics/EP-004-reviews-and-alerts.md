---
description: Epic C4 L2 для post-delivery feedback loop и негативных alert-ов.
status: active
---
# EP-004 Reviews And Alerts

## Value

Замкнуть delivery loop обратной связью и быстро эскалировать проблемные заказы через негативные alert-ы.

## Included features

- `FT-008` two-sided reviews and negative alerts

## Success metrics

- После `COMPLETED` обе стороны могут оставить отзыв.
- Негативный отзыв с любой стороны создает alert через Telegram-бота.
- Негативный отзыв с любой стороны создает alert через Telegram-бота для активных администраторов.
- Review flow фиксирует причину и комментарий в структурированном виде.

## Acceptance criteria

- Клиентский отзыв идет через 3 шага `rating -> reason_code -> comment`.
- Курьерский отзыв о клиенте также идет через Telegram-бота.
- Негативный отзыв любой стороны формирует alert активным администраторам как явное исключение к default actor-targeted notification policy.

## Constraints / invariants

- Feedback loop активируется только после `COMPLETED`.
- Reviews являются двусторонними уже в MVP, а не post-MVP расширением.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): двусторонние отзывы и negative alert rules.
- [doc/PROJECT_SPECIFICATION.md](../../doc/PROJECT_SPECIFICATION.md): narrative feedback flows.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): review structure and event model.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): bot-centric review/alert baseline.
