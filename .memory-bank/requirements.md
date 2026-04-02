---
description: Требования (REQ-IDs) + traceability matrix (RTM).
status: active
---
# Requirements

## Status model
- Document `status`: `draft|active|deprecated|archived`
- RTM `Lifecycle`: `planned|implemented|verified`

## REQ list
- `REQ-001` Public catalog: витрина магазинов и товаров доступна без авторизации.
- `REQ-002` Seller management: продавец управляет только своими магазинами и товарами; seller-side CRUD не выделяется в отдельную capability вне `catalog`.
- `REQ-003` Localization: при первом запуске клиент выбирает язык `ru/en/tj`; выбор сохраняется и входит в MVP acceptance.
- `REQ-004` Telegram auth: Mini App использует `POST /auth/telegram`; доверенные решения опираются только на серверную валидацию raw `initData` и `auth_date`, где `auth_date` имеет TTL не более 10 минут; `initDataUnsafe` не используется для auth decisions, а replay в пределах TTL должен блокироваться; пустой или отсутствующий `initData` в unsupported launch modes не должен обходить auth boundary и требует controlled recovery path.
- `REQ-005` Checkout/payment: заказ создается только после успешной онлайн-оплаты через локального провайдера.
- `REQ-006` Payment failure/retry: при ошибке или таймауте оплаты заказ не создается; клиент получает ошибку и retry-сценарий.
- `REQ-007` Delivery assignment: курьера на заказ вручную назначает администратор; назначение переводит заказ в `ASSIGNED` и инициирует уведомление назначенному курьеру.
- `REQ-008` Delivery tracking: после назначения заказ проходит только валидные серверные переходы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`; невалидный переход возвращает `409 CONFLICT`.
- `REQ-009` Events/polling: каждое значимое доменное изменение создает событие; чтение изменений идет через `GET /events?since=<cursor>`, где cursor/revision возвращаются строкой, а command-ответы публикуют `updated_at` и `revision` для дешевого polling.
- `REQ-010` Polling SLA: целевая p95 задержка отображения обновлений в MVP <= 10 секунд.
- `REQ-011` Order cancellation: отмена доступна только `admin` и `courier` в разрешенном unavailable-кейсе; клиент отменять заказ не может.
- `REQ-012` Manual refund tracking: при отмене возврат средств выполняется вручную и должен отражаться явным refund-состоянием/полем и аудитом.
- `REQ-013` Reviews: после `COMPLETED` запускается двусторонний сбор отзывов; клиент и курьер оставляют отзыв через Telegram-бота.
- `REQ-014` Negative alerts: low rating (`<=2`) с любой стороны MUST порождать негативный alert через Telegram-бота.
- `REQ-015` Admin access: веб-админка использует отдельный login/password контур без self-signup; provisioning админ-аккаунтов выполняет только `boss`.
- `REQ-016` Admin security: пароль админки >= 12 символов; 5 неудачных попыток за 15 минут блокируют вход на 30 минут; входы и блокировки аудируются.
- `REQ-017` Admin sessions: access token 15 минут, refresh/session lifetime 3 дня, auto-logout после 30 минут неактивности.
- `REQ-018` Audit and error contract: критичные действия аудируются; ошибки имеют формат `{ error: { code, message, details }, trace_id }`; raw `initData`, payment secrets и другие чувствительные Telegram/payment payloads не логируются целиком.
- `REQ-019` Mini App shell UX: клиентский контур должен быть адаптирован под Telegram WebView, включая safe-area/stable viewport, светлую/темную тему и явные visual confirmations действий; shell обязан использовать единый runtime adapter для Telegram WebApp API, feature detection через `isVersionAtLeast()`, `viewportStableHeight` вместо pin-to-bottom по `viewportHeight`, Telegram safe-area fields/CSS variables вместо `env(safe-area-inset-*)`, а также учитывать lifecycle `activated/deactivated` и centralized swipe/back policies.
- `REQ-020` Shop rename and snapshot policy: у магазина есть 1 бесплатное переименование; дальнейшие переименования требуют ручного учета платности без отдельного online charge, а `shop_name` в существующих заказах остается snapshot.
- `REQ-021` Trusted payment confirmation: заказ может быть создан только после trusted server-side подтверждения успеха оплаты с проверкой подлинности provider callback/status confirmation и replay protection по payment transaction/idempotency metadata; для Telegram/Bot webhook flows обязательны transport verification (`secret_token` или эквивалент), идемпотентная обработка повторной доставки и DB uniqueness для payment identity; payment/webhook contour также требует health monitoring, alerting по non-2xx/latency и documented manual recovery path.
- `REQ-022` Mini App session and storage security: session identifiers Mini App не хранятся в `localStorage` или другом JS-readable persistent storage как baseline; предпочтителен HttpOnly cookie contour с явной CSRF-стратегией; minimal MVP baseline для cookie-based Mini App session: `SameSite` cookie + `Origin/Referer` validation на server-side; non-sensitive client persistence (например язык) должна иметь явную политику fallback `DeviceStorage -> CloudStorage -> localStorage` и синхронизацию в backend profile после появления auth-контекста; для Mini App auth/payment contour обязателен явный CSP/XSS-hardening baseline.
- `REQ-023` Telegram-specific verification baseline: для `checkout-payment`, `language/localization`, `mini-app shell` и других Telegram-sensitive flows definition of done включает не только browser e2e, но и Telegram-specific verification: mock/runtime contract tests, test environment usage где применимо, и минимум один прогон на реальном `Android Telegram`; более широкая cross-platform matrix (`iOS`, `Desktop/macOS`) сейчас желательна, но не является blocking gate без отдельного explicit request.

## Out of scope
- Авто-назначение курьеров.
- Redis, очереди и автоматические retry уведомлений.
- Автоматические refund-процедуры через payment provider.
- 2FA веб-админки.
- Продвинутая BI-аналитика и автоматический пересчет VIP/репутации.
- Отдельный paid online charge за платное переименование магазина.

## Traceability (RTM)
| REQ | Epic | Feature | Test | Lifecycle |
|---|---|---|---|---|
| REQ-001 | EP-001 | FT-001 | e2e: public catalog browse | done |
| REQ-002 | EP-001 | FT-001 | integration: seller ownership + soft-delete | done |
| REQ-003 | EP-001 | FT-003 | e2e: first-run language selection | done |
| REQ-004 | EP-001 | FT-002 | integration: telegram initData validation | done |
| REQ-005 | EP-001 | FT-002 | e2e: successful payment creates order | done |
| REQ-006 | EP-001 | FT-002 | e2e: failed payment keeps orders absent | done |
| REQ-007 | EP-002 | FT-004 | e2e: admin assigns courier | planned |
| REQ-018 | EP-002 | FT-004 | integration: assignment audit and error contract | planned |
| REQ-008 | EP-002 | FT-005 | integration: order state machine + 409 conflict | planned |
| REQ-009 | EP-002 | FT-005 | e2e: polling returns ordered events | planned |
| REQ-010 | EP-002 | FT-005 | verify: polling SLA p95 <= 10s | planned |
| REQ-011 | EP-002 | FT-006 | e2e: authorized operational cancellation only | planned |
| REQ-012 | EP-002 | FT-006 | integration: refund status + audit persistence | planned |
| REQ-013 | EP-004 | FT-008 | e2e: two-sided review flow via bot | planned |
| REQ-014 | EP-004 | FT-008 | integration: negative alert for both review directions | planned |
| REQ-015 | EP-003 | FT-007 | e2e: admin login/refresh/logout | planned |
| REQ-016 | EP-003 | FT-007 | integration: lockout and auth audit | planned |
| REQ-017 | EP-003 | FT-007 | integration: session TTL and idle timeout | planned |
| REQ-018 | EP-002 | FT-005 | integration: error contract + audit/event generation | planned |
| REQ-018 | EP-002 | FT-006 | integration: cancellation audit and error contract | planned |
| REQ-018 | EP-003 | FT-007 | integration: auth audit and error contract | planned |
| REQ-019 | EP-001 | FT-009 | verify: Android Telegram WebView shell baseline | planned |
| REQ-020 | EP-001 | FT-001 | unit: rename policy and shop name snapshot | done |
| REQ-021 | EP-001 | FT-002 | integration: trusted payment callback and replay protection | done |
| REQ-022 | EP-001 | FT-002, FT-003, FT-009 | integration: session/storage policy + Android shell persistence evidence | planned |
| REQ-023 | EP-001 | FT-003, FT-009 | verify: Telegram-specific test environment and Android real-client evidence | planned |

## Source artifacts

- [doc/PRD.md](../doc/PRD.md): основной продуктовый источник MVP.
- [doc/ARCHITECTURE.md](../doc/ARCHITECTURE.md): архитектурные границы и slice-модель.
- [doc/API_GUIDELINES.md](../doc/API_GUIDELINES.md): базовые API и error contracts.
- [doc/TESTING_STRATEGY.md](../doc/TESTING_STRATEGY.md): тестовая стратегия по slices.
- [doc/DATA_MODEL.md](../doc/DATA_MODEL.md): концептуальная модель данных и refund/event поля.
- [doc/BRIEF_EXT.md](../doc/BRIEF_EXT.md): расширенный baseline по UX, bot flow и transport details.
