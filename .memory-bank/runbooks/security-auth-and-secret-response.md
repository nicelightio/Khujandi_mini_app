---
description: Операционный runbook для lockout-response, token compromise и rotation секретов.
status: active
---
# Security Auth And Secret Response

## Admin lockout response

1. Подтвердить, что lockout вызван policy threshold, а не storage/runtime bug.
2. Проверить audit trail: `login_failed`, `locked`, IP, user-agent, `trace_id`.
3. Если активность выглядит злонамеренной, эскалировать как security incident.
4. Разблокировку или password reset выполнять только по согласованной admin procedure.

## Token compromise response

1. Определить affected user/session scope.
2. Ревокнуть активные refresh/session chains затронутого scope.
3. Перевыпустить credentials по необходимости и проверить audit trail.
4. Зафиксировать incident context и восстановительные действия.

## Telegram and payment secret rotation

1. Подготовить новый secret/token и deployment window.
2. Обновить runtime configuration для `TELEGRAM_BOT_TOKEN` или payment secret boundary.
3. Проверить auth/payment health после rotation, включая webhook `secret_token`/source verification.
4. Зафиксировать время rotation и затронутые контуры в operational log.

## Sensitive payload handling

1. Не логировать raw `initData`, payment tokens, webhook secrets и полные provider payloads.
2. Для incident analysis использовать `trace_id`, canonical transaction ids и минимально достаточные redacted fields.
3. При подозрении на replay/spoofing Telegram traffic сохранить только redacted evidence и verification result.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): security baseline и admin lockout policy.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): auth error surface и admin auth endpoints.
- [.memory-bank/contracts/admin-auth-contract.md](../contracts/admin-auth-contract.md): admin auth rules.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): Mini App auth validation boundary.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): payment trust boundary.
