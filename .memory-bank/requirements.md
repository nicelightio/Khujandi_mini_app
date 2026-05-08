---
description: Требования (REQ-IDs) + traceability matrix (RTM).
status: active
---
# Requirements

## Status model
- Document `status`: `draft|active|deprecated|archived`
- RTM `Lifecycle`: `planned|implemented|verified`
- Historical RTM rows may still use legacy `done` as an alias of `verified`; active drift corrections should prefer explicit `planned|implemented|verified`.

## REQ list
- `REQ-001` Public catalog: витрина магазинов и товаров доступна без авторизации.
- `REQ-002` Seller management: продавец управляет только своими магазинами и товарами; seller-side management остается внутри `catalog`, даже если доставляется через shared storefront и узкую админку магазина.
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
- `REQ-023` Telegram-specific verification baseline: для `checkout-payment`, `language/localization`, `mini-app shell` и других Telegram-sensitive flows definition of done включает не только browser e2e, но и Telegram-specific verification: mock/runtime contract tests и test environment usage где применимо. Реальный `Android Telegram` прогон остается recommended/advisory pre-release risk check, но не блокирует repo-local closure при наличии проходящих repo-local gates; advisory evidence может подтверждаться operator-confirmed notes, а screenshots/videos остаются optional supporting artifacts. Более широкая cross-platform matrix (`iOS`, `Desktop/macOS`) сейчас желательна, но не является blocking gate без отдельного explicit request.
- `REQ-024` Seller storefront edit mode: seller редактирует owned shop в том же storefront contour, что и customer browse; базовый storefront view и компонентная структура остаются общими, edit affordances активируются contextual `long press`/`click`, а отдельный heavy seller builder/editor не вводится.
- `REQ-025` Seller provisioning and access: первый skeleton shop создается admin-side provisioning flow с названием магазина и привязкой Telegram-аккаунта seller-а; seller access по обоим contour-ам должен резолвиться из Telegram-linked identity без отдельного независимого seller password baseline.
- `REQ-026` Shop visibility and store admin: магазин имеет статусы `WORKING` и `NOT_WORKING`; `WORKING` магазин виден seller-у и клиентам, `NOT_WORKING` магазин виден только owning seller-у; отдельная узкая `seller-web` админка магазина в первой версии включает только легкие catalog-owned функции, начиная с переключения этого статуса, без статистики продаж.
- `REQ-027` Catalog runtime durability: канонический runtime path для `catalog` provisioning, seller reads/writes и public storefront resolution должен использовать durable DB-backed persistence; успешные catalog write outcomes должны переживать runtime restart/reset, а `/shops/:publicPath` и связанные catalog reads должны резолвиться из canonical persisted state, а не из route-local in-memory data.
- `REQ-029` Public shop routing identity: `shop.id` остается внутренним technical identifier и MUST NOT использоваться как customer-facing storefront path. Каждый shop MUST иметь два immutable public path: primary path формата `sellerId + N`, где `N` — монотонный порядковый номер shop внутри seller identity без переиспользования, и secondary vanity path как стабильный latin translit shop name без пробелов/спецсимволов с суффиксом `-N` при конфликте. Rename shop name MUST NOT менять уже выданные public path; redirect/history layer для старых path в baseline не требуется.
- `REQ-030` Debug runtime mode: при explicit runtime/build flag `DEBUG=TRUE` checked-in repo MAY включать non-production diagnostic behavior для shared storefront и mounted runtime: ownership guard на `/shops/:publicPath` seller edit path может быть временно ослаблен до debug-only bypass, storefront UI MAY показывать копируемые diagnostic logs, а runtime MAY писать структурированные debug logs для canonical seller read/write path. Такой режим MUST быть полностью env-gated, MUST NOT становиться default production behavior и MUST ограничиваться diagnostic/verification purpose без новой product capability semantics.
- `REQ-028` Transactional catalog provisioning: admin-side provisioning MUST атомарно persist-ить `shop`, Telegram-linked seller binding, starter menu pages и starter products как обычные catalog записи; один seller/Telegram identity MAY иметь несколько shops, если их создает admin provisioning flow, а duplicate/conflicting provisioning для одного и того же target shop identity возвращает controlled error и не оставляет partial state.
- `REQ-031` Customer cart/order composition: клиент должен выбирать товары из public `WORKING` storefront и формировать явный single-shop cart/order composition state до checkout; composition содержит line items, quantities, preview totals and display snapshots, но не создает заказ, не резервирует stock и не является trusted payment amount.
- `REQ-032` Catalog-to-checkout handoff and mounted paid order flow: customer checkout должен стартовать из валидного order composition payload, revalidate current catalog state server-side, пройти Mini App auth/payment boundary и создать order `CREATED` только после trusted successful payment; direct checkout без валидной composition должен вести к controlled recovery, а не к fake order.
- `REQ-033` Customer order status visibility: после paid order creation клиент должен видеть customer-safe статус заказа через event/polling integration с существующим tracking contract, включая `CREATED`, assignment wait, courier progress and terminal states, without exposing delivery operation controls or duplicating `FT-005` lifecycle ownership.
- `REQ-034` Стартовая Витрина и курирование: после выбора языка клиент попадает на стартовую Витрину с catalog-owned списком актуальных product references "Сегодня популярны", до 3 избранных `WORKING` магазинов и ссылкой "весь Худжанд" к общему browse/list магазинов; platform admin с валидной admin session и ролью `BOSS`/`ADMIN` может курировать ссылки через storefront long-press, а seller не получает эти права; Витрина хранит references, не snapshots, и публично скрывает `NOT_WORKING`/deleted shops/products.

## Out of scope
- Авто-назначение курьеров.
- Redis, очереди и автоматические retry уведомлений.
- Автоматические refund-процедуры через payment provider.
- 2FA веб-админки.
- Продвинутая BI-аналитика и автоматический пересчет VIP/репутации.
- Отдельный paid online charge за платное переименование магазина.
- UI-функционал `delete` для shops, menu pages и products.
- Sales stats и другой cross-slice reporting в baseline `seller-web` админки магазина.

## Traceability (RTM)
| REQ | Epic | Feature | Test | Lifecycle |
|---|---|---|---|---|
| REQ-001 | EP-001 | FT-001 | e2e: public catalog browse | done |
| REQ-002 | EP-001 | FT-001 | integration: seller ownership guards | done |
| REQ-003 | EP-001 | FT-003 | e2e: first-run language selection | done |
| REQ-004 | EP-001 | FT-002 | integration: raw `initData` validation + replay guard | implemented |
| REQ-005 | EP-001 | FT-002 | integration/front-smoke: trusted paid checkout order creation | implemented |
| REQ-006 | EP-001 | FT-002 | integration/front-smoke: failed payment keeps orders absent | implemented |
| REQ-007 | EP-002 | FT-004 | e2e: admin assigns courier | done |
| REQ-018 | EP-002 | FT-004 | integration: assignment audit and error contract | done |
| REQ-008 | EP-002 | FT-005 | integration: order state machine + 409 conflict | done |
| REQ-009 | EP-002 | FT-005 | e2e: polling returns ordered events | done |
| REQ-010 | EP-002 | FT-005 | verify: polling SLA p95 <= 10s | done |
| REQ-011 | EP-002 | FT-006 | e2e: authorized operational cancellation only | done |
| REQ-012 | EP-002 | FT-006 | integration: refund status + audit persistence | done |
| REQ-013 | EP-004 | FT-008 | e2e: two-sided review flow via bot | done |
| REQ-014 | EP-004 | FT-008 | integration: negative alert for both review directions | done |
| REQ-015 | EP-003 | FT-007 | e2e: admin login/refresh/logout | done |
| REQ-016 | EP-003 | FT-007 | integration: lockout and auth audit | done |
| REQ-017 | EP-003 | FT-007 | integration: session TTL and idle timeout | done |
| REQ-018 | EP-002 | FT-005 | integration: error contract + audit/event generation | done |
| REQ-018 | EP-002 | FT-006 | integration: cancellation audit and error contract | done |
| REQ-018 | EP-003 | FT-007 | integration: auth audit and error contract | done |
| REQ-019 | EP-001 | FT-009 | verify: Android Telegram WebView shell baseline | done |
| REQ-020 | EP-001 | FT-001 | unit: rename policy and shop name snapshot | done |
| REQ-021 | EP-001 | FT-002 | integration: trusted payment callback and replay protection | implemented |
| REQ-022 | EP-001 | FT-002, FT-003, FT-009, FT-010 | integration/verify: session-storage policy + Android shell evidence; seller runtime session-boundary hardening remains follow-up-based | implemented |
| REQ-023 | EP-001 | FT-003, FT-009 | verify: Telegram-specific test env + Android shell evidence; checkout runtime pending | implemented |
| REQ-024 | EP-001 | FT-010 | e2e: seller edits shared storefront without separate builder; repo-local shared-storefront tests now prove owner edit-mode reuse on the existing catalog tree and explicit delete-free baseline evidence | done |
| REQ-025 | EP-001 | FT-010 | integration/e2e: admin-provisioned skeleton + Telegram-linked seller access; provisioning/runtime and admin/seller smoke coverage now verify starter bootstrap and shared seller session/access reuse | done |
| REQ-026 | EP-001 | FT-010 | e2e: `WORKING/NOT_WORKING` visibility and seller store-admin status toggle; runtime/frontend verification now proves owner-only `NOT_WORKING` visibility, public gating, status-only seller-web control, and delete-free narrow scope | done |
| REQ-027 | EP-001 | FT-011 | integration/manual: durable provisioning and restart-safe storefront resolution from canonical persisted catalog state | verified |
| REQ-028 | EP-001 | FT-011 | integration/manual: transactional provisioning rollback + duplicate/conflict fail-closed behavior, same-seller multi-shop provisioning when names differ, plus final restart-durability closure | verified |
| REQ-029 | EP-001 | FT-010, FT-011 | integration/frontend: public storefront routing uses immutable public paths while technical `shop.id` remains internal | implemented |
| REQ-030 | EP-001 | FT-010 | debug/manual: env-gated storefront diagnostics, debug-only seller bypass, and structured runtime logs stay non-production and explicit | planned |
| REQ-031 | EP-001 | FT-012 | frontend/contract: customer selects products into a visible single-shop cart/order composition payload before checkout; unavailable repair blocks handoff | verified |
| REQ-032 | EP-001 | FT-013, FT-002 | e2e/integration: catalog/cart handoff revalidates composition and creates order only after trusted payment on mounted customer runtime; repo-local gates passed in `TASK-FT013-07`, Android Telegram smoke remains advisory pre-release risk check | verified |
| REQ-033 | EP-001 | FT-014, FT-005 | e2e/frontend: customer status screen consumes ordered polling/events from paid order creation through delivery completion; repo-local mounted `/api/v1/events`, customer scoping, cursor compatibility and frontend polling gates passed through `TASK-FT014-07`, Android Telegram smoke remains advisory pre-release risk check | verified |
| REQ-034 | EP-001 | FT-015 | e2e/integration: выбор языка ведет на стартовую Витрину; public read резолвит live catalog references; admin-only long-press curation add/remove и cap избранных магазинов enforced | verified |

## Source artifacts

- [doc/PRD.md](../doc/PRD.md): основной продуктовый источник MVP.
- [doc/ARCHITECTURE.md](../doc/ARCHITECTURE.md): архитектурные границы и slice-модель.
- [doc/API_GUIDELINES.md](../doc/API_GUIDELINES.md): базовые API и error contracts.
- [doc/TESTING_STRATEGY.md](../doc/TESTING_STRATEGY.md): тестовая стратегия по slices.
- [doc/DATA_MODEL.md](../doc/DATA_MODEL.md): концептуальная модель данных и refund/event поля.
- [doc/BRIEF_EXT.md](../doc/BRIEF_EXT.md): расширенный baseline по UX, bot flow и transport details.
