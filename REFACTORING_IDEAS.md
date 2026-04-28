# Refactoring Ideas

Дата анализа: 2026-04-28.

Scope: только production/source code. Исключены `tests/`, `frontend/src/tests/`, `*.test.*`, `*.spec.*`, `.tasks/`, `.protocols/`, `node_modules`, build/dist/coverage artifacts.

Метод: выполнен project priming по `AGENTS.md`, затем найдено 10 крупнейших production/source code-файлов больше 300 строк в текущем worktree. Для каждого файла был запущен отдельный read-only subagent. Код, tests и Memory Bank не менялись; перезаписан только этот отчет.

Архитектурная рамка: layered modular monolith, vertical slices, явные boundaries через contracts/interfaces/schemas, business/domain rules внутри owning slice, `shared` только для доказанных технических primitives без преждевременного выноса бизнес-логики.

## Top-10 Code Files

| # | Lines | File |
|---|---:|---|
| 1 | 875 | `frontend/src/slices/catalog/styles/catalog-storefront.css` |
| 2 | 839 | `frontend/src/admin/styles/admin-theme.css` |
| 3 | 656 | `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts` |
| 4 | 602 | `frontend/src/slices/catalog/api/catalog-api.ts` |
| 5 | 550 | `backend/src/slices/catalog/infrastructure/prisma/catalog-runtime-prisma.fixture.ts` |
| 6 | 534 | `frontend/src/slices/catalog/components/catalog-page.tsx` |
| 7 | 503 | `backend/src/dev-runtime/catalog-runtime-repository.ts` |
| 8 | 499 | `backend/src/slices/admin-access/presentation/admin-auth-http.ts` |
| 9 | 450 | `backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository.ts` |
| 10 | 448 | `backend/src/slices/admin-access/application/admin-access.service.ts` |

## Executive Verdict

Текущий top-10 изменился после недавнего split `backend/src/dev-runtime/dev-api-server.ts`: он больше не является одним из крупнейших файлов. Основные риски теперь лежат не в размере одного composition root, а в трех типах долгов:

- Security/session correctness: `admin-access.service.ts` и `admin-auth-http.ts` требуют аккуратного hardening-refactor вокруг session activity, refresh rotation, body/cookie/trace handling.
- Data correctness/concurrency: `reviews-feedback.repository.ts` и `order-cancellation.repository.ts` имеют риски cursor/revision consistency, draft concurrency и atomic state updates.
- Frontend/WebView maintainability: крупные CSS и `catalog-page.tsx` все еще смешивают presentation modes, decorative effects, cart/editor orchestration и brittle selectors.

Большой rewrite не нужен. Лучшее направление: короткие behavior-preserving passes с targeted tests, затем отдельные semantic hardening tasks для P1 concurrency/security issues. Не создавать широкий `shared`; максимум локальные helpers внутри owning slice/contour, кроме уже доказанных технических primitives вроде generic magnetic CSS.

## File Conclusions

### 1. `frontend/src/slices/catalog/styles/catalog-storefront.css`

Owning area: `catalog`, `mini-app/storefront` contour, presentation CSS.

Вердикт: рефакторить стоит. Файл смешивает customer storefront, seller edit mode, debug panel, cropper, cart и decorative effects; это хрупко для Telegram WebView.

Основные риски:

- Один CSS-файл на 875 строк связывает hero, tabs, products, cart, editor, debug и cropper через глобальные `data-*` selectors.
- `[data-magnetic="true"]` пересекается с admin theme и shared hook, но живет локально в catalog.
- Always-on effects: fixed beam, pulse, multiple `backdrop-filter`, large shadows, filter/crossfade layers.
- Seller-controlled media URL используется через CSS variable `background-image: var(...)`; нужна отдельная проверка URL construction/sanitization.
- `!important`, DOM-coupled selectors и fixed/sticky zones усложняют safe-area/keyboard behavior.

Минимальное направление:

- Split внутри `catalog/styles`: `storefront-shell`, `storefront-products-cart`, `storefront-editor`, `storefront-motion`.
- Рассмотреть единственный shared-кандидат: минимальный CSS для proven technical primitive `[data-magnetic="true"]`.
- Сделать decorative motion opt-in/degradable для weak Android Telegram WebView.
- Заменить DOM-coupled selectors на явные `data-*`, убрать `!important` точечными selectors.
- Проверить media URL сборку рядом с компонентом.

Priority: P1 medium-high для WebView/performance и boundary drift.

### 2. `frontend/src/admin/styles/admin-theme.css`

Owning area: `admin-web` contour, presentation CSS for admin surfaces.

Вердикт: рефакторить стоит локально. Это не security blocker, но текущая глобальность и order-dependent layout повышают риск admin UI regressions.

Основные риски:

- `:root` tokens и app-wide import могут протекать за пределы `admin-web`.
- Global `[data-magnetic="true"]` не scoped к admin contour.
- Layout rules завязаны на `:first-child`, `+ form`, `last-child`.
- В одном файле смешаны tokens, shell, auth chrome, layout primitives, login, scene controls, responsive и keyframes.
- Fixed pseudo-elements, multiple gradients, blur/filter и infinite pulse повышают motion/performance debt.

Минимальное направление:

- Scope tokens/global reset к `body[data-root-contour="admin-web"]` или `[data-admin-shell="root"]`.
- Scope magnetic CSS или заменить на contour-specific data attribute.
- Заменить order-dependent layout на explicit zones: `data-admin-panel="context|workspace|full"`.
- Split на admin-local CSS files: `tokens-shell`, `page-layout`, `ui-primitives`, `scene-controls-motion`.
- Сделать status pulse/scene motion opt-in или reduced по low-power/reduced-motion profile.

Priority: P2.

### 3. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`

Owning area: `reviews-feedback` infrastructure repository; bot flow is a presentation consumer.

Вердикт: рефакторить нужно точечно. Файл лежит в правильном slice/layer, но имеет P1 correctness risks вокруг revision/cursor и durable drafts.

Основные риски:

- Duplicate `P2002` fallback возвращает `revision = existingReview.id`, тогда как нормальный path возвращает event cursor.
- `upsertReviewDraft()` перезаписывает draft без DB-level compare-and-set по stage/revision.
- `listActiveAdminUsers()` содержит alert-recipient policy в infrastructure.
- Persisted enum/string values приводятся unchecked casts без runtime validation.
- Повторяются `select` shapes и Prisma arg types; `P2002` guard не проверяет `meta.target`.
- Event payload содержит полный `comment` и user ids; нужна explicit privacy/contract проверка для shared events visibility.

Минимальное направление:

- Исправить duplicate fallback: возвращать existing review вместе с persisted event cursor или стабильным revision contract.
- Добавить revision-aware draft update/CAS boundary.
- Вынести repeated `select` constants/mappers локально внутри файла.
- Сузить `P2002` handling по expected target.
- Явно вынести admin-target policy в application или переименовать repository method как policy-bound read model.

Priority: P1 для revision consistency и draft CAS; P2 для policy/validation cleanup.

### 4. `frontend/src/slices/catalog/api/catalog-api.ts`

Owning area: `catalog` frontend API adapter for public storefront and seller-protected catalog surfaces.

Вердикт: рефакторить стоит без выноса в `shared`. Файл в целом fail-closed, но остается identity/error boundary debt.

Основные риски:

- `getSellerStorefrontAccess(shopId)` фактически использует public path; это смешивает `shop.id` и public routing identity.
- Seller/public mappers частично дублируются.
- Project error contract `{ error, trace_id }` теряется в generic `Catalog request failed with status X`.
- Numeric parsing допускает `NaN`/`Infinity`; `response.json()` не защищен от пустого/invalid body.
- Один adapter смешивает legacy browse, canonical storefront read и protected seller writes.
- 401/403/404 seller access схлопываются в `null`, что fail-closed, но может скрывать session regressions.

Минимальное направление:

- Переименовать `shopId` parameter в `publicPath` и закрепить public-path vs technical-id split.
- Добавить slice-local `CatalogApiError` с `code`, `traceId`, `details`.
- Объединить repeated mapper primitives внутри файла/folder.
- Ужесточить finite/integer parsing money fields.
- Разделить файл на local modules: public reads, seller reads/writes, mappers/errors.

Priority: P1 medium-high перед расширением catalog API.

### 5. `backend/src/slices/catalog/infrastructure/prisma/catalog-runtime-prisma.fixture.ts`

Owning area: `catalog` infrastructure dev/test fixture.

Вердикт: рефакторить стоит только как containment. Нельзя превращать fixture в улучшенный второй source of truth.

Основные риски:

- Fake Prisma shape частично дублирует `catalog-prisma.types.ts` и реальные reader/writer expectations.
- Constraint parity неполная: вручную эмулируются только часть unique/FK cases.
- `$transaction` через clone/assign не моделирует DB isolation/concurrency.
- Event ids/payloads shallow clone и не доказывают production event semantics.
- Fixture содержит domain-adjacent uniqueness/provisioning logic и может начать конкурировать с canonical DB-backed runtime.

Минимальное направление:

- Явно держать файл как dev/test fixture shim, не production/runtime source of truth.
- Уменьшить local type duplication через existing Prisma-like types, если это не усложняет код.
- Вынести только fixture-local helpers: unique error builder, projection, relation lookup.
- Confidence переносить в parity tests против DB-backed Prisma path, а не расширять fake.

Priority: P2, P1 если fixture используется как acceptance proof для `REQ-027/REQ-028`.

### 6. `frontend/src/slices/catalog/components/catalog-page.tsx`

Owning area: `catalog` mini-app/storefront presentation plus seller edit mode.

Вердикт: рефакторить стоит slice-local. Shared extraction не нужна; проблема в overgrown component и смешении UI/orchestration.

Основные риски:

- 534 строки смешивают browse list, storefront layout, seller edit activation, cart composition, checkout handoff, debug UI и parallax.
- `setPendingCartReplacement()` вызывается внутри `setComposition()` updater.
- `startCheckoutHandoff` напрямую пишет `sessionStorage` и делает `window.location.assign`.
- Scroll/resize listener с `getBoundingClientRect()` и CSS var writes живет в feature component без shell capability/degradation signal.
- Hardcoded English copy при наличии i18n layer.

Минимальное направление:

- Вынести cart composition orchestration в slice-local hook.
- Вынести cart summary JSX в `CatalogCartSummary` внутри catalog components.
- Изолировать parallax в `useStorefrontParallaxEffect` и подключить reduced/low-power shell signal.
- Убрать nested state side-effect, заменить explicit transition.
- Постепенно перенести hardcoded labels в existing copy layer.

Priority: P1 для cart/handoff state simplification; P2 для WebView motion isolation.

### 7. `backend/src/dev-runtime/catalog-runtime-repository.ts`

Owning area: `catalog` dev-runtime compatibility adapter.

Вердикт: рефакторить стоит в сторону удаления/сужения, а не улучшения. Файл выглядит legacy и может закреплять второй source of truth.

Основные риски:

- Дублирует canonical DB-backed `PrismaCatalogRepository` semantics: uniqueness, public path conflicts, provisioning transaction, event payloads.
- Fake `P2002` без Prisma metadata и raw `Error` mixing могут расходиться с production error mapping.
- Event builders дублируют catalog event semantics отдельно от slice-owned Prisma events.
- Clone transaction не моделирует DB isolation/concurrency.
- Реальное использование выглядит ограниченным; mounted runtime уже идет через Prisma-like module.

Минимальное направление:

- Перевести оставшиеся тесты/потребителей на canonical `PrismaCatalogRepository` через `createInMemoryCatalogPrisma` или SQLite-backed fixture.
- После этого удалить файл или пометить как non-normative legacy adapter.
- Не добавлять новые business rules/events в этот adapter.
- Если оставить временно, добавить parity tests против canonical repository.

Priority: P2, P1 перед новыми catalog runtime changes.

### 8. `backend/src/slices/admin-access/presentation/admin-auth-http.ts`

Owning area: `admin-access`, `admin-web` presentation HTTP adapter.

Вердикт: рефакторить стоит как security hardening без изменения успешной семантики.

Основные риски:

- `readBody` без body size limit на auth endpoints.
- `parseCookies` использует `decodeURIComponent` без защиты от malformed cookie.
- `x-trace-id` принимается без normalization/length limit.
- `OPTIONS` может вернуть `405`, если admin-web окажется cross-origin без proxy.
- Cookies имеют `Path=/`, шире минимального admin auth/API scope.
- Presentation файл смешивает routing, body/cookie/origin/trace/session response/protected helper.

Минимальное направление:

- Сохранить public exports: `createAdminAuthHttpHandler`, `resolveProtectedAdminRouteSession`.
- Вынести local helpers внутри `admin-access/presentation`: cookies, origin, body, response.
- Добавить behavior-compatible hardening: bounded body, safe cookie decode, trace id normalization.
- Не выносить session/auth policy в `shared`.

Priority: P1 для body/cookie/trace hardening; P2 для structural split.

### 9. `backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository.ts`

Owning area: `order-cancellation` infrastructure repository.

Вердикт: рефакторить нужно, потому что есть concurrency correctness risk вокруг cancellation.

Основные риски:

- `recordCancellation()` читает current order status, но update делает по `id` без conditional `status/isDeleted`; concurrent lifecycle update может привести к stale write и некорректному audit/event.
- `recordRefundUpdate()` лучше защищен через `updateMany`, но type/data path допускает `NOT_REQUIRED` для manual refund update.
- Raw enum casts без runtime validation.
- Повторяется order select/map в нескольких paths.
- Repository уже содержит infra-level consistency checks; нельзя расширять сюда role/state business policy.

Минимальное направление:

- Вынести local `orderSelect` и `mapOrderRecord`.
- Перевести cancellation update на atomic conditional write: `id + oldStatus + isDeleted=false`, затем fetch updated order.
- Сузить manual refund terminal input до `DONE | REJECTED`.
- Добавить local enum parsers/asserts для persisted values.

Priority: P1 для atomic cancellation update; P2 для refund type narrowing.

### 10. `backend/src/slices/admin-access/application/admin-access.service.ts`

Owning area: `admin-access` application layer, `admin-web` session/auth policy.

Вердикт: рефакторить нужно, но не косметически. Главная ценность в security/session correctness и atomic boundaries.

Основные риски:

- `resolveProtectedSession` проверяет idle timeout, но не обновляет `lastActivityAt/idleExpiresAt`; если protected requests считаются активностью, session policy работает не так, как ожидается.
- Refresh rotation не compare-and-set; parallel refresh может выпустить несколько token pairs и оставить один ответ stale.
- Lockout flow не транзакционный: lock, revoke sessions, audit могут частично примениться.
- Login success создает session до audit; при падении audit возможна session без audit trail.
- Expired/idle sessions в protected resolve fail-closed, но не revocation/cleanup consistent с refresh/logout.
- Дублируется session expiry logic.

Минимальное направление:

- Добавить private helper для единой валидации session state.
- Уточнить idle activity policy и, если нужно, добавить repository method `touchSessionActivity`.
- Добавить atomic repository operations: `rotateRefreshSessionIfCurrent`, `lockAccountAndRevokeSessionsWithAudit`, возможно `createSessionWithAudit`.
- Убрать повторный login account lookup после failed verification.

Priority: P1 для idle activity semantics, atomic refresh rotation и lockout transaction.

## Suggested Refactor Order

1. `backend/src/slices/admin-access/application/admin-access.service.ts`: session correctness, atomic refresh rotation, lockout transaction boundaries.
2. `backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository.ts`: atomic cancellation update and refund terminal type narrowing.
3. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`: duplicate event revision consistency and draft CAS.
4. `backend/src/slices/admin-access/presentation/admin-auth-http.ts`: body limit, safe cookie decode, trace normalization, then local helper split.
5. `frontend/src/slices/catalog/api/catalog-api.ts`: publicPath/shopId identity cleanup and structured error contract preservation.
6. `frontend/src/slices/catalog/components/catalog-page.tsx`: cart/handoff hook, cart summary extraction, WebView motion isolation.
7. `backend/src/dev-runtime/catalog-runtime-repository.ts`: migrate consumers away and delete/scope as legacy adapter.
8. `backend/src/slices/catalog/infrastructure/prisma/catalog-runtime-prisma.fixture.ts`: containment cleanup and parity tests against DB-backed path.
9. `frontend/src/slices/catalog/styles/catalog-storefront.css`: local CSS split and WebView performance/motion degradation cleanup.
10. `frontend/src/admin/styles/admin-theme.css`: admin-local CSS split, selector scoping, order-independent layout zones.

## Spec-Layer Files Over 300 Lines

Без анализа, только список:

| Lines | File |
|---:|---|
| 1518 | `.memory-bank/tasks/archive/backlog-full-pre-compaction-2026-04-19.md` |
| 694 | `.memory-bank/changelog/archive/changelog-full-pre-compaction-2026-04-19.md` |
| 434 | `.memory-bank/tasks/backlog.md` |
| 392 | `.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md` |
| 309 | `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` |

## Implementation Constraints

- Не менять production behavior внутри structural refactor tasks без отдельного explicit scope.
- Security/concurrency fixes выделять отдельными tasks с targeted regression tests и evidence.
- Не выносить slice-specific business rules, catalog provisioning semantics, review stepper policy, admin session policy или storefront presentation semantics в широкий `shared`.
- Shared extraction допустим только для доказанных технических primitives: HTTP/error primitives, cookie utilities, UI primitives, shell/runtime adapters, generic magnetic interaction styling.
- Для backend persistence refactor сохранять event/audit/error contracts and revision semantics; после изменений запускать slice-specific integration/runtime tests.
- Для frontend WebView/UI refactor проверять weak Android Telegram assumptions, safe-area/keyboard bottom actions, reduced motion и отсутствие debug/customer leakage.
- Для dev-runtime cleanup не усиливать in-memory/fake adapters как second source of truth; confidence переносить на DB-backed runtime tests.
- После каждого meaningful refactor: `git diff --check`, UTF-8 без BOM/trailing whitespace, targeted tests; Memory Bank обновлять отдельной docs-first задачей, если меняется architecture/contract intent.
