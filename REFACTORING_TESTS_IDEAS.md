# Refactoring Ideas

Дата анализа: 2026-04-22.

Scope: 10 самых больших code-файлов проекта больше 300 строк, без `.memory-bank/`, `.tasks/`, `.protocols/`, `node_modules`, build/dist/coverage artifacts.

Метод: по каждому файлу был запущен отдельный read-only subagent. Код не менялся. Итог ниже объединяет выводы subagents и мой общий вердикт через архитектурные правила проекта: modular/layered monolith, vertical slices, локальные contracts/interfaces/schemas, без широкого `shared` до доказанной повторяемости.

## Top 10 Files

| # | Lines | File |
|---|---:|---|
| 1 | 1341 | `tests/slices/catalog/catalog.integration.spec.ts` |
| 2 | 1063 | `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts` |
| 3 | 939 | `tests/slices/catalog/catalog.unit.spec.ts` |
| 4 | 915 | `tests/slices/admin-access/admin-access.integration.spec.ts` |
| 5 | 912 | `tests/slices/catalog/catalog.runtime.provisioning.cases.ts` |
| 6 | 895 | `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts` |
| 7 | 785 | `tests/slices/checkout-payment/checkout-payment.integration.spec.ts` |
| 8 | 751 | `frontend/src/admin/styles/admin-theme.css` |
| 9 | 708 | `tests/slices/checkout-payment/checkout-payment.unit.spec.ts` |
| 10 | 696 | `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts` |

## Executive Verdict

Рефакторинг имеет смысл для всех 10 файлов, но почти везде это должен быть узкий cleanup внутри owning slice/contour, а не архитектурная перестройка.

Главный повторяющийся запах: крупные test suites смешивают несколько boundary-зон в одном `describe`, вручную дублируют Prisma doubles/fixtures, проверяют implementation shape вместо contract behavior и потому становятся хрупкими при безопасных инфраструктурных изменениях.

Наиболее важные production-level цели:

- `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`: усилить mappers и draft/event persistence, потому что есть риск semantic drift в replay/stale-callback и event cursor semantics.
- `frontend/src/admin/styles/admin-theme.css`: убрать order-dependent selectors, слишком широкую стилизацию кнопок и production-mounted dev scene controls.
- `tests/slices/checkout-payment/checkout-payment.integration.spec.ts`: улучшить coverage модели транзакций/idempotency, потому что текущий `$transaction` fake не доказывает rollback/race semantics для auth/payment boundary.

Общее правило для будущего refactor wave: не создавать глобальный test framework. Делать `*-test-helpers.ts`, builders и case-файлы рядом с конкретным slice, пока повторяемая польза за пределами slice не доказана.

## File Conclusions

### 1. `tests/slices/catalog/catalog.integration.spec.ts`

Вердикт: рефакторить стоит.

Файл полезен как catalog integration coverage, но один большой `describe("catalog public browse integration")` фактически покрывает разные boundary-зоны: public browse, admin provisioning read model, seller access, seller writes, menu/product writes и events.

Что криво или хрупко:

- Большой `createPrismaMock` и объемные fixtures встроены прямо в spec.
- Есть сильная привязка к Prisma `select` shape, например вокруг строк 671, 808, 1137.
- Повторяются shop/menu/product objects, особенно вокруг строк 628, 951, 1060.
- Тесты смешивают controller/repository assertions и contract behavior.

Лучшее направление:

- Разбить на catalog-local boundary files: `public-read`, `seller-access`, `seller-shop-writes`, `menu-page-writes`, `product-writes`, `admin-provisioning-read`.
- Вынести `createPrismaMock` и typed builders в `tests/slices/catalog/` helper.
- Уменьшить white-box assertions на Prisma query shape, оставив точные checks там, где это действительно repository-adapter contract.

### 2. `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`

Вердикт: рефакторить стоит.

Файл смешивает module/repository integration, bot flow, negative alert fan-out и replay-hardening. Это ухудшает диагностику падений и делает сценарии дорогими в поддержке.

Что криво или хрупко:

- `createPrismaProvider` с in-memory `reviewDraft` засоряет spec и может разойтись с реальным Prisma boundary.
- Повторяются order/user/review/event fixtures.
- Вручную собираются encoded callback strings вместо использования `buildReviewStepperCallbackData`.
- Проверка `createTestContext` выглядит случайно прилипшей к slice-тесту.
- Один длинный сценарий одновременно проверяет courier bot flow, low-rating event, admin fan-out, duplicate callback и ordering.

Лучшее направление:

- Оставить helpers внутри `tests/slices/reviews-feedback`.
- Разделить на case/helper файлы: `module persistence`, `negative alert`, `bot flow`, `replay hardening`.
- Перенести exact callback encoding в focused harness/unit cases, а integration-тесты писать через intent builders.

### 3. `tests/slices/catalog/catalog.unit.spec.ts`

Вердикт: рефакторить стоит как maintenance-задачу.

Файл держит большой ручной `CatalogRepository` fake и много copy-paste records. Есть risk, что fake отстанет от repository contract и unit tests не заметят boundary drift.

Что криво или хрупко:

- `withWriteEvent` всегда возвращает `entity: "shop"`, даже для menu/product write tests.
- Многие `SellerCatalogShop` fixtures не содержат `primaryPublicPath/secondaryPublicPath`, хотя public routing identity уже нормативен.
- Повторяются shop/menu/product records.
- Ранние тесты вида "behind repository boundary" дают мало behavior-сигнала.
- Хвост product-ownership tests лучше читается отдельным `describe("product writes")`.

Лучшее направление:

- Разбить `describe("catalog service")` на `public/admin reads`, `seller access`, `provisioning`, `shop writes`, `menu page writes`, `product writes`.
- Добавить catalog-scoped builders: `shop(overrides)`, `menuPage(overrides)`, `product(overrides)`, `binding(overrides)`.
- Сделать `repositoryDouble` полным и типобезопасным через `satisfies CatalogRepository`.
- Заменить повторные exact `new AppError(...)` на локальный `expectAppError(code, status, details)`.

### 4. `tests/slices/admin-access/admin-access.integration.spec.ts`

Вердикт: рефакторить стоит.

Файл важен для `FT-007`, но сейчас выглядит как смесь service/repository-adapter тестов с mock Prisma, а не чистая integration-проверка.

Что криво или хрупко:

- 8 крупных `it` cases, часть больше 100 строк.
- Fake Prisma provider вручную собирается почти в каждом тесте.
- Дублируется точная форма Prisma `select`, например вокруг строк 69, 569, 704.
- `createTestContext` используется только для проверки, что context содержит тот же mock.
- `.rejects.toEqual(new AppError(...))` лучше заменить на checks по error contract fields.

Лучшее направление:

- Сделать slice-local `createAdminAccessPrismaHarness()`.
- Добавить builders для admin account/session/audit.
- Разделить repository-adapter spec для Prisma mapping/select/count/update и сценарный application/module spec для login/refresh/logout/lockout.
- HTTP/cookie/origin/restart boundary оставить в существующих HTTP integration tests.

### 5. `tests/slices/catalog/catalog.runtime.provisioning.cases.ts`

Вердикт: рефакторить стоит.

Файл покрывает важный `FT-011` runtime boundary, но смешивает admin-auth guard, provisioning identity/conflicts, durable restart, admin read model, seller storefront durability и legacy repair.

Что криво или хрупко:

- Первый `it` одновременно проверяет anonymous, manager, boss success и duplicate conflict.
- Много прямых проверок через `runtime.catalogState`; для runtime-boundary тестов это лучше прятать за intent helper или чаще проверять через API/repository boundary.
- Есть зависимость от порядка `bindings[0]` вместо фильтрации по `sellerId/shopId`.
- Сценарии admin-access sessions смешаны с catalog provisioning write path.
- Legacy repair вручную создает SQLite table и JSON payload прямо в тесте.
- `adminOrigin` используется и для seller/public запросов, что размывает contour naming.

Лучшее направление:

- Разбить на 3-5 case-файлов: `provisioning-auth`, `provisioning-conflicts`, `provisioning-durability`, `admin-provisioning-list`, `legacy-runtime-normalization`.
- Вынести helpers: `startBossRuntime`, `withPersistentCatalogRuntime`, `provisionShop`, `expectProvisioningConflict`, `expectStarterBundle`, `seedLegacyCatalogRuntimeState`.
- Не делать универсальный HTTP DSL; helpers должны оставаться catalog-runtime specific.

### 6. `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts`

Вердикт: рефакторить стоит как test-level cleanup.

Файл не ломает vertical slice, но перегружен fixture/assertion blocks и несколькими хрупкими mock patterns.

Что криво или хрупко:

- Первый сценарий проверяет сразу lookup, три status transitions, history, events, invocation order, polling и empty polling.
- Используется `mock.calls.length - 1` для выбора времени/revision; это ломается при добавлении внутренних вызовов.
- Проверка `createTestContext` не относится к acceptance `FT-005`.
- Notifier outage scenario дважды проводит одинаковый `ASSIGNED -> IN_PROGRESS` на статическом `orderFindUnique`, что плохо имитирует persisted state machine.
- Event fixtures и expected polling response почти полностью дублируются.

Лучшее направление:

- Вынести local builders: `order`, `statusChangedEvent`, `expectedPollingEvent`, `createDeliveryTrackingPrismaMock`, `expectNoWriteSideEffects`.
- Сократить первый сценарий или разделить его на focused checks.
- Заменить `mock.calls.length` на явный stateful fake или `mockResolvedValueOnce`.
- Разделить notifier tests на "notify after commit" и "outage swallowed".

### 7. `tests/slices/checkout-payment/checkout-payment.integration.spec.ts`

Вердикт: рефакторить стоит, и это один из более важных test refactors.

Файл смешивает module wiring, Telegram auth/session, language sync и payment finalization. Текущий `$transaction` fake не доказывает rollback/atomic semantics, хотя auth replay и payment idempotency критичны по спецификации.

Что криво или хрупко:

- `createPrismaProvider` имитирует `$transaction` как простой callback.
- Полный Prisma double повторяется почти в каждом тесте.
- Auth happy-path тест проверяет слишком много сразу: response shape, cookie metadata, replay guard, user upsert, session create.
- Language sync тест семантически слабый: проверяет прямой update по `telegramId`, но не доказывает защищенный runtime/session boundary.
- Duplicate payment delivery не покрывает race-path через unique conflict `P2002`.

Лучшее направление:

- Вынести checkout-local helpers: `createCheckoutPaymentTestModule(overrides)`, `prismaClientDouble(overrides)`, `orderRecord(overrides)`, `checkoutInput(overrides)`, `validInitData(overrides)`, `expectNoOrderWrites()`.
- Разделить `describe` на `module wiring`, `telegram auth/session`, `language sync handoff`, `payment finalization`.
- Добавить focused coverage для rollback/race/idempotency semantics без изменения production behavior.

### 8. `frontend/src/admin/styles/admin-theme.css`

Вердикт: рефакторить стоит как локальный cleanup `admin-web` presentation layer.

Проблема не в размере CSS сама по себе, а в смешении shell/theme, page layout primitives, page-specific login styles и dev scene controls в одном файле.

Что криво или хрупко:

- Layout завязан на порядок детей через `:first-child`, `:nth-child(2)`, `last-child`, `form:first-of-type`.
- Слишком широкие селекторы вроде `[data-admin-page="shell"] button` могут случайно стилизовать будущие кнопки.
- Fixed pseudo-elements с gradients/blur/animations всегда активны; `prefers-reduced-motion` отключает animation, но не удешевляет слои.
- `data-admin-scene="controls"` выглядит как dev tooling, а `AdminSceneControls` всегда монтируется.
- Повторяются `rgba(...)` border/background literals.

Лучшее направление:

- Остаться внутри `frontend/src/admin`, без глобального `shared`.
- Разделить CSS на contour-local layers: `tokens/base`, `shell`, `page-primitives`, `debug/scene-controls`.
- Заменить order-dependent layout на явные slots/attributes: `data-admin-panel="context|workspace|full-width|hero"`.
- Сузить button styling до explicit `data-admin-ui="button"`.
- Env/debug-gate-ить scene controls или вынести их из production admin shell.

### 9. `tests/slices/checkout-payment/checkout-payment.unit.spec.ts`

Вердикт: рефакторить стоит как test-only cleanup.

Один `describe("checkout-payment service")` держит payment finalization, repository delegation, Telegram auth/session, replay guard и language sync. Это размывает сценарные границы `FT-002`.

Что криво или хрупко:

- Повторяются order/payment objects.
- Первые delegation-тесты дают мало behavior-сигнала.
- Payment block завязан на полную форму record/input.
- Auth block слишком длинный и смешивает cookie contract, replay payload и user mapping.
- Хак `language: "de" as "ru"` скрывает намеренный negative input.

Лучшее направление:

- Добавить checkout-local builders: `orderDraft()`, `paidOrder()`, `paymentConfirmation(overrides)`, `service(overrides)`, `repositoryDouble(overrides)`.
- Разбить на `repository delegation`, `payment confirmation`, `telegram auth`, `language sync`.
- Заменить exact `new AppError(...)` comparisons на `expectAppError(code, status, details)`.
- Для invalid language использовать explicit negative-input helper или `@ts-expect-error`.

### 10. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`

Вердикт: рефакторить стоит, это production-level refactor внутри `reviews-feedback/infrastructure`.

Файл перегружен hand-written Prisma-like types/select-shapes, мапперами, event payload construction и draft persistence logic. Тут есть не только maintenance-шум, но и потенциальные semantic risks.

Что криво или хрупко:

- Hand-written Prisma-like типы/select-shapes местами выглядят как domain-типы для raw Prisma enum/string данных, что повышает drift-риск.
- Mappers в основном делают `as` без validation, особенно для `ReviewDraft.direction/expectedStage`.
- Дублируется event payload construction для `review.created` и `review.negative`.
- `upsertReviewDraft` слепо перезаписывает draft state; для revision-aware stale callback лучше рассмотреть conditional update/CAS по `expectedStage + expectedRevision + expiresAt`.
- Duplicate path возвращает `revision = existingReview.id`, тогда как обычный path берет revision из `event.id`; это потенциально кривой cursor-сигнал.

Лучшее направление:

- Выделить slice-local raw Prisma record/select constants.
- Добавить строгие mappers с runtime validation для string-backed domain values.
- Вынести `buildReviewEventPayload` / `createReviewEvent` helper.
- Отдельно hardened draft persistence helper для conditional/CAS semantics.
- Не переносить admin/bot ownership и не вводить shared repository abstraction.

## Suggested Refactor Order

1. `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`: production semantic risk вокруг mappers, draft overwrite и revision/cursor.
2. `tests/slices/checkout-payment/checkout-payment.integration.spec.ts`: payment/auth boundary test realism, transaction/idempotency/race coverage.
3. `frontend/src/admin/styles/admin-theme.css`: production UI maintainability, order-dependent selectors и dev controls.
4. `tests/slices/catalog/catalog.runtime.provisioning.cases.ts`: critical `FT-011` runtime acceptance coverage, разбить без потери restart/durability checks.
5. `tests/slices/catalog/catalog.integration.spec.ts`: largest file, boundary-first split даст максимальный maintenance эффект.
6. Остальные test suites: проводить cleanup opportunistically при следующем изменении соответствующего slice.

## Constraints For Implementation

- Не менять behavior в рамках refactor tasks без отдельного explicit scope.
- Не выносить helpers в глобальный `shared`, если они нужны только одному slice.
- Каждый refactor делать маленькими волнами: сначала helpers/builders, затем split by boundary, затем focused tests/gates.
- После каждого test refactor запускать релевантный slice gate, а не весь проект без необходимости.
- Для production refactor repository/CSS дополнительно делать focused regression tests или smoke, потому что эти файлы влияют на runtime behavior/UI.
