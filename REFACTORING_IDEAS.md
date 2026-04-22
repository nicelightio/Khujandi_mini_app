# Refactoring Ideas

## Prompt

```text
Сформируй заново `REFACTORING_IDEAS.md` для этого проекта.

Правила:
- Сначала выполни project priming по `AGENTS.md`: прочитай `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md` если есть, `.memory-bank/index.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, затем минимально нужные architecture/contracts/testing docs.
- Анализируй только production/source code. Исключи `tests/`, `frontend/src/tests/`, `*.test.*`, `.tasks/`, `.protocols/`, `node_modules`, build/dist/coverage artifacts.
- Найди 10 самых больших code-файлов проекта при условии, что каждый больше 300 строк.
- Для каждого из 10 файлов запусти отдельного read-only subagent. Subagent ничего не должен менять в коде.
- Каждый subagent должен оценить файл на рефакторинг согласно архитектуре проекта: modular/layered monolith, vertical slices, boundaries через contracts/interfaces/schemas, без широкого `shared` до доказанной повторяемости.
- Каждый subagent должен искать неадекватные, кривые, накостыленные, duplicated, overgrown, brittle, security/data/performance-risky решения, которые можно оптимизировать.
- По каждому файлу нужен короткий conclusion: имеет ли смысл рефакторить, почему, и какое минимальное направление рефакторинга лучше.
- Отдельно найди `.memory-bank/**/*.md` больше 300 строк и выведи их только списком без анализа.
- Итог запиши в `REFACTORING_IDEAS.md`: top-10 code files с line counts, executive verdict, file-by-file conclusions, suggested refactor order, spec-layer files over 300 lines, implementation constraints.
- Не меняй production code, tests и Memory Bank. Менять можно только `REFACTORING_IDEAS.md`.
- После записи проверь UTF-8 без BOM, отсутствие trailing whitespace и `git diff --check`.
```

Дата анализа: 2026-04-22.

Scope: только production/source code проекта. Исключены `tests/`, `frontend/src/tests/`, `*.spec.*`, `*.test.*`, `.memory-bank/`, `.tasks/`, `.protocols/`, `node_modules`, build/dist/coverage artifacts.

Метод: по каждому из 10 крупнейших code-файлов больше 300 строк был использован read-only subagent. Код не менялся. Рекомендации ниже держатся в рамках архитектуры проекта: modular/layered monolith, vertical slices, локальные contracts/interfaces/schemas, без широкого `shared` до доказанной повторяемости.

## Top 10 Code Files

| # | Lines | File |
|---|---:|---|
| 1 | 751 | `frontend/src/admin/styles/admin-theme.css` |
| 2 | 696 | `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts` |
| 3 | 671 | `frontend/src/slices/catalog/components/catalog-page.tsx` |
| 4 | 575 | `backend/src/dev-runtime/dev-api-server.ts` |
| 5 | 540 | `backend/src/dev-runtime/catalog-runtime-prisma.ts` |
| 6 | 529 | `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts` |
| 7 | 502 | `frontend/src/slices/catalog/styles/catalog-storefront.css` |
| 8 | 489 | `backend/src/dev-runtime/catalog-runtime-repository.ts` |
| 9 | 489 | `backend/src/slices/admin-access/presentation/admin-auth-http.ts` |
| 10 | 452 | `frontend/src/slices/catalog/api/catalog-api.ts` |

## Executive Verdict

Рефакторинг имеет смысл для всех 10 code-файлов. В отличие от test-only cleanup, здесь есть несколько production semantic risks:

- `dev-runtime` catalog doubles частично расходятся с durable catalog semantics `REQ-027/028`.
- `telegram-bot` review flow держит state-machine/domain rules вне owning slice.
- `catalog-api.ts` содержит fallback `publicPath -> id`, конфликтующий с `REQ-029`.
- `admin-auth-http.ts` дублирует session validation в presentation и имеет security-hardening gaps.
- Frontend storefront/admin CSS и `catalog-page.tsx` смешивают baseline UI, seller edit mode и debug controls.

Общее правило: не строить общий framework. Резать локально внутри owning slice/contour: `catalog`, `admin-access`, `reviews-feedback`, `dev-runtime`. Shared abstractions добавлять только после повторяемого доказательства общности.

## File Conclusions

### 1. `frontend/src/admin/styles/admin-theme.css`

Вердикт: рефакторить стоит как локальный cleanup `admin-web` presentation layer.

Проблема не в CSS как таковом, а в смешении shell/theme, page layout primitives, page-specific login styles и dev scene controls в одном файле.

Что хрупко:

- Layout завязан на порядок детей через `:first-child`, `:nth-child(2)`, `last-child`, `form:first-of-type`.
- Широкие селекторы вроде `[data-admin-page="shell"] button` будут случайно стилизовать будущие кнопки.
- Fixed pseudo-elements с gradients/blur/animations всегда активны; `prefers-reduced-motion` отключает animation, но не удешевляет слои.
- `data-admin-scene="controls"` выглядит как dev tooling, а `AdminSceneControls` монтируется в production shell.
- Много повторяющихся `rgba(...)` literals.

Минимальное направление:

- Разделить внутри `frontend/src/admin`: `tokens/base`, `shell`, `page-primitives`, `debug/scene-controls`.
- Заменить order-dependent layout на explicit slots: `data-admin-panel="context|workspace|full-width|hero"`.
- Сузить button styling до `data-admin-ui="button"`.
- Env/debug-gate-ить scene controls или вынести их из production shell.

### 2. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`

Вердикт: рефакторить стоит, это production-level refactor внутри `reviews-feedback/infrastructure`.

Файл перегружен hand-written Prisma-like types/select-shapes, мапперами, event payload construction и draft persistence logic. Есть semantic risks вокруг replay/stale callback и cursor semantics.

Что хрупко:

- Hand-written Prisma-like типы/select-shapes местами выглядят как domain-типы для raw Prisma enum/string данных.
- Mappers в основном делают `as` без validation, особенно для `ReviewDraft.direction/expectedStage`.
- Дублируется event payload construction для `review.created` и `review.negative`.
- `upsertReviewDraft` слепо перезаписывает draft state; для revision-aware stale callback лучше conditional update/CAS по `expectedStage + expectedRevision + expiresAt`.
- Duplicate path возвращает `revision = existingReview.id`, тогда как обычный path берет revision из `event.id`.

Минимальное направление:

- Выделить slice-local raw Prisma record/select constants.
- Добавить строгие mappers с runtime validation для string-backed domain values.
- Вынести `buildReviewEventPayload` / `createReviewEvent`.
- Добавить hardened draft persistence helper с conditional/CAS semantics.
- Не переносить admin/bot ownership и не вводить shared repository abstraction.

### 3. `frontend/src/slices/catalog/components/catalog-page.tsx`

Вердикт: рефакторинг имеет смысл.

Файл смешивает public browse, shared storefront, seller edit UI, debug/visual tooling и часть view-model contracts. Это production UI файл, а не просто большой компонент.

Что хрупко:

- `CatalogStorefront*` типы экспортируются из component-layer; model/hooks начинают зависеть от component-типа. Это неправильное направление зависимости.
- `StorefrontVisualControls` рендерятся всегда, а не только при `DEBUG=TRUE`; это dev tooling в customer/seller path и WebView performance risk.
- Product card rendering дублируется для обычных и legacy/unpaged products.
- Большие области кликабельны для edit mode; в Telegram WebView случайный tap/scroll может открыть editor, а `contextmenu` как long-press ненадежен.
- Есть hardcoded English copy при обязательной локализации.
- Image URL напрямую вставляется в CSS `url(...)`; нужен локальный quote/sanitize/fallback helper.

Минимальное направление:

- Разделить на `CatalogBrowseList`, `StorefrontPage`, `StorefrontHero`, `StorefrontTabs`, `StorefrontMenuPanel`, `StorefrontProductCard`, `StorefrontEditorPanel`, `StorefrontDebugTools`.
- Перенести VM/editor типы в `model/storefront`.
- Debug/visual controls включать только через `DEBUG=TRUE`.
- Добавить явный edit activation helper/affordances вместо больших скрытых click zones.

### 4. `backend/src/dev-runtime/dev-api-server.ts`

Вердикт: рефакторинг имеет смысл.

`startDevApiServer` уже не просто composition root: он одновременно монтирует runtime, роутит HTTP, парсит DTO, решает auth/debug access, мапит ошибки и частично ходит в repository напрямую.

Что хрупко:

- Mini App auth/session runtime остается in-memory; для seller access это критично, потому что catalog уже durable, а session/replay state теряется при restart.
- Fallback на `"test-bot-token"` и `secureCookies: false` опасны, если runtime используется production-like deploy path.
- `resolveDebugStorefrontAccess` ловит любой error и в `DEBUG` пытается bypass; debug mode может маскировать реальные runtime ошибки.
- Runtime handlers ходят в `catalogModule.repository` напрямую, обходя controller/application boundary.
- Много silent coercion через `String(...)` / `Number(...)`; пустые строки, `NaN`, `null` могут пройти глубже.
- Public catalog routes без `try/catch`, в отличие от seller/admin routes.
- Error mapping повторяется в route blocks.

Минимальное направление:

- Оставить `startDevApiServer` composition root.
- Вынести внутри `backend/src/dev-runtime` route modules: `mini-app-auth-routes`, `catalog-public-routes`, `seller-catalog-routes`, `admin-catalog-routes`.
- Добавить маленький `runtimeRoute` helper для `try/catch`, `traceId`, JSON errors и DTO parsing.
- Изолировать debug access policy.
- Убрать repository-direct calls через новые catalog controller/application methods.

### 5. `backend/src/dev-runtime/catalog-runtime-prisma.ts`

Вердикт: рефакторинг имеет смысл.

Это source-level dev-runtime adapter, но сейчас он стал 540-строчным Prisma-like runtime double, где смешаны table adapters, select mapping, uniqueness rules, event creation, transaction emulation и persistence commits. Это высокий drift-risk относительно `catalog` vertical slice и `FT-011` durable runtime semantics.

Что рискованно:

- Транзакция через `cloneCatalogState -> callback -> Object.assign` не сериализует concurrent writes; duplicate provisioning может пройти optimistic last-writer-wins.
- Ручная Prisma-форма заканчивается `as never`, обходя типобезопасность boundary.
- Дублируется filtering/projection logic, которая может разойтись с catalog infra readers/selects.
- Product write позволяет записать `menuPageId` без проверки существования и принадлежности тому же shop.
- Binding create проверяет duplicate `shopId`, но не проверяет существование shop и соответствие `sellerId` shop owner.
- Event creation принимает arbitrary `entity` и кастит к `CatalogWriteEvent["entity"]` без validation.

Минимальное направление:

- Разделить внутри `backend/src/dev-runtime/catalog-runtime-prisma/` на локальные table adapters: `shop`, `menu-page`, `product`, `binding`, `event`, `transaction`.
- Добавить helpers `createP2002`, `findShopOrThrow`, `project*`.
- Типизировать итоговый client через `satisfies PrismaClientLike` вместо `as never`.
- Усилить transaction commit: serialized queue/mutex или commit-time unique validation against live state.

### 6. `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`

Вердикт: рефакторинг имеет смысл.

Файл стал не просто bot integration adapter: он держит часть `reviews-feedback` application/domain semantics: completed-gate, ownership resolution, draft transitions, reason-code validation, replay handling и submit orchestration.

Что хрупко:

- Дублирует slice rules из `ReviewsFeedbackService`: `COMPLETED` gate, actor ownership, target role resolution.
- `Number.parseInt` пропускает payload вроде `"5abc"` как rating `5`; нужен строгий parse на `1..5`.
- `getDraft -> matchesExpectedStep -> persistDraft` без atomic CAS; concurrent callbacks могут оба пройти проверку на старом draft.
- `reasonCode` валидируется в integration contour, а slice service принимает любой non-empty `reasonCode`.
- Финальный submit + mark-submitted logic дублируется.
- Поврежденный submitted draft маскируется через `rating ?? 0` и `reasonCode ?? ""`.
- Локальный `PendingReviewDraft` почти копирует slice record и добавляет computed `actorRole`.

Минимальное направление:

- Перенести stateful review-stepper semantics в `reviews-feedback/application`: например `ReviewsFeedbackBotFlowService` или `ReviewDraftStepper`.
- В `telegram-bot` оставить transport glue: parse callback, call slice workflow, send prompts/alerts.
- Ввести строгий parser payload, reason-code policy в owning slice и draft CAS.

### 7. `frontend/src/slices/catalog/styles/catalog-storefront.css`

Вердикт: рефакторинг имеет смысл, локально внутри `frontend/src/slices/catalog`.

Файл смешивает storefront layout/theme, sticky menu/product cards, seller editor modal, image cropper и debug/visual tuning controls.

Что хрупко:

- Много `backdrop-filter`/blur/glass surfaces; риск для weak Android Telegram WebView.
- Используется `!important`, что указывает на specificity smell.
- Fixed modal/backdrop layers живут рядом с обычным storefront CSS.
- Visual/debug controls выглядят как tooling/debug surface, но находятся в baseline CSS.
- Hero/content backgrounds перегружены layered gradients, glow и pattern overlay.

Минимальное направление:

- Split by responsibility внутри `catalog/styles`: `storefront-layout.css`, `storefront-products.css`, `storefront-editor.css`, `storefront-debug.css`.
- Добавить локальные CSS variables для colors/elevation/blur и cheap fallback через `@supports`/shell capability class.
- Убрать `!important` через более точный selector scope.
- Debug/editor CSS держать отдельно от customer storefront baseline.

### 8. `backend/src/dev-runtime/catalog-runtime-repository.ts`

Вердикт: рефакторить стоит, но сначала проверить, нужен ли файл вообще.

Файл выглядит как устаревший параллельный in-memory `CatalogRepository`: он дублирует catalog infrastructure boundary, хотя текущий mounted runtime уже идет через `createInMemoryCatalogPrisma -> createCatalogModule -> PrismaCatalogRepository`.

Что хрупко:

- Один класс смешивает public/admin/seller reads, seller writes, provisioning и event construction.
- `page.shopStatus` используется как денормализованный фильтр public menu pages; смена `shop.status` не обновляет menu pages.
- Pseudo-transaction через full state clone и `Object.assign` не моделирует DB uniqueness/concurrency.
- Дублируются event payload builders и ручная установка `createdAt`.
- Provisioning переиспользует seller `createProduct`, создавая adapter drift по starter events.
- При переносе product/menuPage между shop не пересчитываются связанные `sellerId/shopStatus`.

Минимальное направление:

- Проверить, можно ли удалить `InMemoryCatalogRepository` из runtime barrel.
- Если нельзя, явно обозначить как non-normative dev adapter и привести к parity с Prisma boundary.
- Разложить локально по boundary-зонам: public reader, admin reader, seller reader, seller writer, provisioning transaction, event builders.

### 9. `backend/src/slices/admin-access/presentation/admin-auth-http.ts`

Вердикт: рефакторинг имеет смысл, локально внутри `admin-access/presentation`.

Главная boundary-проблема: `resolveProtectedAdminRouteSession` прямо создает `PrismaAdminAccessRepository` и сам валидирует session/account. Это дублирует application-level session semantics из `AdminAccessService` и протаскивает infrastructure dependency в presentation.

Что хрупко:

- `parseCookies` может бросить `URIError` на malformed percent-encoding и превратить плохой cookie в `500`.
- Безусловное доверие `x-forwarded-for` spoofable без trusted-proxy policy.
- Произвольный `x-trace-id` принимается без length/charset normalization.
- `readBody` читает body без лимита; login endpoint нужен небольшой max body size.
- `assertAllowedOrigin` смешан с handler и protected-session helper.
- Handler вручную ветвится по login/refresh/logout и повторяет cookie/session response assembly.

Минимальное направление:

- Разделить на slice-local modules: `admin-auth-cookie-transport.ts`, `admin-auth-origin-policy.ts`, `admin-auth-http-handler.ts`, `protected-admin-session.ts`.
- Protected-session validation перенести в application method/service.
- Presentation оставить adapter-слоем: cookie/origin extraction и response mapping.

### 10. `frontend/src/slices/catalog/api/catalog-api.ts`

Вердикт: рефакторинг имеет смысл.

Это production API-boundary файл, который смешивает public browse, seller protected reads/writes, DTO-типы, ручную runtime-валидацию и error mapping.

Что хрупко:

- Fallback `publicPath -> id` конфликтует с `REQ-029`: `shop.id` не должен становиться customer-facing route identity.
- Один `CatalogApi` объединяет public read и seller write protected surface.
- `listCatalog()` делает N+1 запросы `/shops` + `/shops/:publicPath/products`, что рискованно для Telegram WebView latency.
- Structured error contract `{ error, trace_id }` теряется; UI получает только `status`.
- `401/403/404` схлопываются в `null`, размывая `auth missing`, `foreign shop`, `not found`.
- Ручные validators разрослись и используют repeated `as`.

Минимальное направление:

- Разрезать внутри `frontend/src/slices/catalog/api/`: `public-catalog-api.ts`, `seller-catalog-api.ts`, `catalog-api-errors.ts`, `catalog-api-mappers.ts`.
- Сохранить внешний facade `createCatalogApi()` временно для совместимости.
- Убрать fallback `publicPath=id` или fail-closed до runtime normalization.
- Добавить typed error mapping и разделить protected seller semantics от public browse.

## Suggested Refactor Order

1. `backend/src/dev-runtime/catalog-runtime-prisma.ts`: высокий drift-risk с `REQ-027/028`, transaction/concurrency и fake Prisma boundary.
2. `frontend/src/slices/catalog/api/catalog-api.ts`: прямой конфликт с `REQ-029` через `publicPath -> id`, потеря error contract.
3. `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`: domain state machine находится в integration contour.
4. `backend/src/slices/admin-access/presentation/admin-auth-http.ts`: presentation держит infra dependency и security-hardening gaps.
5. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`: mappers/draft CAS/revision semantics.
6. `backend/src/dev-runtime/dev-api-server.ts`: route modules, debug policy, repository-direct calls.
7. `frontend/src/slices/catalog/components/catalog-page.tsx`: split storefront/editor/debug и убрать component-type dependency direction.
8. `frontend/src/admin/styles/admin-theme.css` и `frontend/src/slices/catalog/styles/catalog-storefront.css`: CSS split, cheap WebView fallback, debug gating.
9. `backend/src/dev-runtime/catalog-runtime-repository.ts`: удалить или явно понизить до non-normative dev adapter.

## Spec Layer Files Over 300 Lines

Без анализа, только список:

| Lines | File |
|---:|---|
| 1518 | `.memory-bank/tasks/archive/backlog-full-pre-compaction-2026-04-19.md` |
| 694 | `.memory-bank/changelog/archive/changelog-full-pre-compaction-2026-04-19.md` |
| 392 | `.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md` |
| 309 | `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` |

## Implementation Constraints

- Не менять behavior в рамках refactor tasks без отдельного explicit scope.
- Не делать global shared/framework layer из локальных helpers.
- Для backend production refactor сначала добавить/сохранить focused regression coverage по owning slice.
- Для frontend WebView/UI refactor проверять weak Android Telegram behavior, motion/blur fallback и отсутствие визуальной регрессии.
- Для `dev-runtime` refactor отдельно проверять parity с durable DB-backed catalog runtime и admin/session boundaries.
