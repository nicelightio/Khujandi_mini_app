---
description: HOW-гайд по реализации event publication, polling consumers и Telegram-бота без semantic drift.
status: active
---
# Events Polling And Bot Integration

## Related architecture

- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../architecture/events-polling-and-bot-runtime.md): WHAT/WHY для событий, polling и bot runtime.

## How to publish events

1. Выполни domain validation и persistence change.
2. Сохрани domain событие только после успешного write.
3. Верни `revision` и `updated_at`, если это помогает downstream polling sync.
4. Не добавляй в payload transport-specific шум, который не является бизнес-фактом.

## How to consume polling

- Используй `GET /events?since=<cursor>`.
- Сохраняй последний примененный `next_cursor` строкой.
- Обрабатывай duplicate fetch idempotently.
- Не смешивай event transport state и domain state machine.

## How to wire Telegram bot flows

- Все inbound bot actions проходят actor validation и state checks.
- Review flow идет step-by-step: `rating -> reason_code -> comment`.
- `review.negative` fan-out отправляется активным администраторам.
- Suspicious/spoofed/noisy inbound traffic не должен порождать side effects без дополнительной проверки.

## Source artifacts

- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): `/events` и error/event baseline.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): примеры событий и bot interaction.
