---
description: Backlog и execution plan (waves) для реализации.
status: active
---
# Backlog

> `/prd` rule: этот backlog не должен автоматически порождать TASK-IDs. Декомпозиция делается точечно через `/prd-to-tasks FT-<NNN>`.

## Current state

- PRD -> Memory Bank bootstrap завершен на уровне `product`, `requirements`, `epics`, `features`, `testing`.
- `FT-001` декомпозирована в implementation plan и task cards.
- `FT-002` декомпозирована в implementation plan и task cards.
- `FT-003` декомпозирована в implementation plan и task cards.
- `FT-009` декомпозирована в implementation plan и task cards.
- Telegram-specific normative layer для `FT-002`, `FT-003` и `FT-009` расширен через `contracts/*`, `runbooks/*` и `diagrams/*`.
- `FT-003` execution backlog закрыт: `TASK-FT003-01` ... `TASK-FT003-06` завершены; shared Telegram shell/runtime closure дополнительно закрыта в `FT-009`.
- `FT-004` декомпозирована в implementation plan, protocol docs и execution-ready backlog decomposition для courier assignment.
- `FT-005` декомпозирована в implementation plan, protocol docs и execution-ready backlog decomposition для delivery tracking, ordered polling и SLA verification.
- `FT-006` декомпозирована в implementation plan, protocol docs и execution-ready backlog decomposition для operational cancellation и manual refund tracking.
- Следующие features `FT-007`, `FT-008` пока не декомпозированы в `TASK-*` и ждут точечного `/prd-to-tasks FT-<NNN>`.
- Ближайшее действие: декомпозировать `FT-007`, чтобы закрыть отдельный admin auth/security contour для delivery/admin workflows.

## Recommended feature order

1. `FT-001`, `FT-002`, `FT-003`, `FT-009` для первой customer-facing волны.
2. `FT-004`, `FT-005`, `FT-006` для delivery operations.
3. `FT-007` для отдельного admin auth/security контура.
4. `FT-008` для post-delivery feedback loop и go-live hardening.

## Decomposed feature backlog

## FT-001 — Catalog Browse And Seller Management

### Wave W1 — low-risk / foundation

### TASK-FT001-01 — Freeze catalog contracts and docs-first boundaries
- TASK-ID: `TASK-FT001-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `none`
- Touched files: `.memory-bank/contracts/catalog-public-api.md`, `.memory-bank/contracts/seller-catalog-write-policy.md`, `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`, `.memory-bank/tasks/plans/IMPL-FT-001.md`, `.memory-bank/index.md`
- Tests: doc-level traceability review against `REQ-001`, `REQ-002`, `REQ-020`
- Verify: подтвердить, что public read, seller ownership и rename policy явно зафиксированы в contract/docs layer и не конфликтуют с RTM
- Docs: `contracts/*`, `features/FT-001`, `tasks/plans/IMPL-FT-001`, `index.md`
- Normative Inputs: `FT-001`, `requirements.md`, `data-boundaries-and-persistence.md`, `testing/index.md`

### TASK-FT001-02 — Scaffold backend catalog slice and Prisma baseline
- TASK-ID: `TASK-FT001-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/catalog/**/*`, `backend/src/shared/**/*`, `tests/slices/catalog/**/*`
- Tests: backend test skeleton for catalog integration/unit coverage
- Verify: backend repo содержит owning `catalog` slice skeleton по слоям и минимальный test harness без premature shared business logic
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: сохранять layered slice structure; не разносить catalog business rules в `shared`

### TASK-FT001-03 — Scaffold frontend catalog slice and public route shell
- TASK-ID: `TASK-FT001-03`
- Status: `done`
- Wave: `W1`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-02`
- Touched files: `frontend/src/app/router.tsx`, `frontend/src/slices/catalog/**/*`, `frontend/src/shared/**/*`, `frontend/src/tests/slices/catalog/**/*`
- Tests: frontend test skeleton for catalog route/UI smoke
- Verify: frontend route shell и slice layout существуют и не смешивают catalog UI с non-catalog business logic
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации

### Wave W2 — core logic

### TASK-FT001-04 — Implement public shop and product reads with soft-delete filtering
- TASK-ID: `TASK-FT001-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/presentation/**/*`, `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for unauthenticated browse and exclusion of soft-deleted entities
- Verify: `shops/products` публично читаются без auth и не возвращают soft-deleted data
- Docs: `features/FT-001`, `contracts/catalog-public-api.md`, `changelog.md`
- Verification Targets: public `shops` and `products` browse flow

### TASK-FT001-05 — Implement seller-scoped shop writes and rename policy flags
- TASK-ID: `TASK-FT001-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/domain/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for seller ownership on shop writes; unit tests for first-free-then-paid rename flag logic
- Verify: seller может менять только свои shops; rename после бесплатной попытки включает manual paid path markers
- Docs: `contracts/seller-catalog-write-policy.md`, `features/FT-001`, `changelog.md`
- Invariants: `shop_name_snapshot` invariant сохраняется за счет отсутствия cross-table mutation side effects при rename

### TASK-FT001-06 — Implement seller-scoped product writes
- TASK-ID: `TASK-FT001-06`
- Status: `done`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-002`
- Depends on: `TASK-FT001-01`, `TASK-FT001-02`
- Touched files: `backend/src/slices/catalog/application/**/*`, `backend/src/slices/catalog/domain/**/*`, `backend/src/slices/catalog/infrastructure/**/*`, `tests/slices/catalog/**/*`
- Tests: integration tests for seller ownership on product writes and shop/product linkage validation
- Verify: seller не может создавать/изменять product вне собственных shops
- Docs: `contracts/seller-catalog-write-policy.md`, `features/FT-001`, `changelog.md`

### Wave W3 — integration & polish

### TASK-FT001-07 — Wire public catalog UI to backend read path
- TASK-ID: `TASK-FT001-07`
- Status: `done`
- Wave: `W3`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `TASK-FT001-03`, `TASK-FT001-04`
- Touched files: `frontend/src/slices/catalog/routes/**/*`, `frontend/src/slices/catalog/components/**/*`, `frontend/src/slices/catalog/api/**/*`, `frontend/src/slices/catalog/model/**/*`, `frontend/src/tests/slices/catalog/**/*`
- Tests: UI/integration smoke for public browse rendering and loading/error states
- Verify: Mini App customer-facing catalog route показывает shops/products без auth и корректно обрабатывает empty/loading states
- Docs: `features/FT-001`, `changelog.md`

### TASK-FT001-08 — Add catalog verification suite and final docs sync
- TASK-ID: `TASK-FT001-08`
- Status: `done`
- Wave: `W3`
- Feature: `FT-001`
- REQs: `REQ-001`, `REQ-002`, `REQ-020`
- Depends on: `TASK-FT001-04`, `TASK-FT001-05`, `TASK-FT001-06`, `TASK-FT001-07`
- Touched files: `tests/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`, `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`
- Tests: final backend integration, rename unit checks, public browse e2e smoke
- Verify: acceptance criteria из `FT-001` полностью покрыты tests/UAT и RTM остается согласованной
- Docs: `features/FT-001`, `requirements.md`, `changelog.md`, при необходимости `contracts/*`
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`

### TASK-FT001-09 — Add repo test runner config for catalog specs
- TASK-ID: `TASK-FT001-09`
- Status: `done`
- Wave: `W2`
- Feature: `FT-001`
- REQs: `REQ-001`
- Depends on: `none`
- Touched files: `package.json`, `jest.config.*`, `tsconfig*.json`, `tests/**/*`, `backend/**/*`
- Tests: run `catalog.unit.spec.ts` and `catalog.integration.spec.ts` through repo-local harness
- Verify: repo can execute backend catalog `.spec.ts` files without temporary ad-hoc CLI tooling
- Docs: `tasks/backlog.md`, `changelog.md`, if needed `testing/index.md`

## FT-002 — Checkout Payment And Order Creation

### Wave W1 — low-risk / foundation

### TASK-FT002-01 — Freeze checkout auth, session and payment boundaries
- TASK-ID: `TASK-FT002-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-002`
- REQs: `REQ-004`, `REQ-021`, `REQ-022`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`, `.memory-bank/tasks/plans/IMPL-FT-002.md`, `.memory-bank/contracts/telegram-mini-app-auth-contract.md`, `.memory-bank/contracts/payment-confirmation-contract.md`, при необходимости `.memory-bank/adrs/*`
- Tests: doc-level traceability review against `REQ-004`, `REQ-021`, `REQ-022`, `REQ-023`
- Verify: подтвердить, что session transport policy, replay/idempotency rules и trusted payment boundary явно зафиксированы и не противоречат RTM/feature acceptance
- Docs: `features/FT-002`, `contracts/*`, `tasks/plans/IMPL-FT-002`, при необходимости `adrs/*`
- Normative Inputs: `FT-002`, `requirements.md`, `telegram-mini-app-auth-contract.md`, `payment-confirmation-contract.md`, `invariants.md`

### TASK-FT002-02 — Scaffold backend checkout-payment slice and persistence baseline
- TASK-ID: `TASK-FT002-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-002`
- REQs: `REQ-005`, `REQ-021`
- Depends on: `TASK-FT002-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/checkout-payment/**/*`, `backend/src/shared/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: backend test skeleton for auth/payment/order integration and unit coverage
- Verify: repo содержит owning `checkout-payment` slice skeleton, explicit payment identity fields и baseline test harness без выноса payment business logic в `shared`
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: сохранять layered slice structure; payment/order ownership остается внутри `checkout-payment`

### TASK-FT002-03 — Scaffold frontend checkout-payment slice and route shell
- TASK-ID: `TASK-FT002-03`
- Status: `done`
- Wave: `W1`
- Feature: `FT-002`
- REQs: `REQ-005`, `REQ-022`
- Depends on: `TASK-FT002-01`
- Touched files: `frontend/src/app/router.tsx`, `frontend/src/slices/checkout-payment/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, `frontend/src/shared/telegram/**/*`, `frontend/src/shared/state/**/*`
- Tests: frontend test skeleton for checkout route/model/payment UX smoke
- Verify: checkout route shell и slice layout существуют, переиспользуют existing Telegram runtime primitives и не хранят session identifiers в JS-readable persistent storage baseline
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации

### Wave W2 — core logic

### TASK-FT002-04 — Implement Telegram auth validation and session issuance
- TASK-ID: `TASK-FT002-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-002`
- REQs: `REQ-004`, `REQ-022`
- Depends on: `TASK-FT002-01`, `TASK-FT002-02`
- Touched files: `backend/src/slices/checkout-payment/presentation/**/*`, `backend/src/slices/checkout-payment/application/**/*`, `backend/src/slices/checkout-payment/domain/**/*`, `backend/src/slices/checkout-payment/infrastructure/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: unit tests for HMAC/TTL helpers; integration tests for valid, invalid, expired and replayed `initData`
- Verify: `POST /auth/telegram` принимает raw `initData`, валидирует подпись и `auth_date`, блокирует replay и выдает session согласно зафиксированной transport policy
- Docs: `features/FT-002`, `contracts/telegram-mini-app-auth-contract.md`, `changelog.md`
- Verification Targets: `POST /auth/telegram`

### TASK-FT002-05 — Implement trusted payment finalization and paid-only order creation
- TASK-ID: `TASK-FT002-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-002`
- REQs: `REQ-005`, `REQ-021`
- Depends on: `TASK-FT002-01`, `TASK-FT002-02`, `TASK-FT002-04`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/checkout-payment/application/**/*`, `backend/src/slices/checkout-payment/domain/**/*`, `backend/src/slices/checkout-payment/infrastructure/**/*`, `backend/src/slices/checkout-payment/presentation/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: integration tests for trusted callback/status confirmation, duplicate delivery idempotency, DB uniqueness and single-order creation
- Verify: successful trusted payment создает ровно один order с `payment_status = PAID`; duplicate callback/status confirmation не создает второй order
- Docs: `features/FT-002`, `contracts/payment-confirmation-contract.md`, `changelog.md`
- Invariants: нет order creation по client-only payment signals; payment finalization и order creation остаются atomic

### TASK-FT002-06 — Implement failed payment handling and retry-safe error contract
- TASK-ID: `TASK-FT002-06`
- Status: `done`
- Wave: `W2`
- Feature: `FT-002`
- REQs: `REQ-006`
- Depends on: `TASK-FT002-05`
- Touched files: `backend/src/slices/checkout-payment/presentation/**/*`, `backend/src/slices/checkout-payment/application/**/*`, `backend/src/slices/checkout-payment/domain/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: integration tests for failed, cancelled and timeout payment outcomes plus absence of `orders` side effects
- Verify: payment failure paths возвращают controlled error contract и retry semantics без создания order
- Docs: `features/FT-002`, `changelog.md`, при необходимости `runbooks/*`
- Verification Targets: `POST /orders/checkout`

### Wave W3 — integration & polish

### TASK-FT002-07 — Wire Mini App checkout UI to auth and payment flow
- TASK-ID: `TASK-FT002-07`
- Status: `done`
- Wave: `W3`
- Feature: `FT-002`
- REQs: `REQ-005`, `REQ-006`, `REQ-022`
- Depends on: `TASK-FT002-03`, `TASK-FT002-04`, `TASK-FT002-05`, `TASK-FT002-06`
- Touched files: `frontend/src/slices/checkout-payment/routes/**/*`, `frontend/src/slices/checkout-payment/components/**/*`, `frontend/src/slices/checkout-payment/api/**/*`, `frontend/src/slices/checkout-payment/model/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, `frontend/src/shared/telegram/**/*`
- Tests: UI/integration smoke for checkout happy path, payment failure retry UX and no client-only order creation
- Verify: customer-facing checkout route инициирует auth/payment backend flow, показывает retry UX и не использует client-only payment signals как business confirmation
- Docs: `features/FT-002`, `changelog.md`

### TASK-FT002-08 — Add checkout verification suite and Telegram-specific evidence sync
- TASK-ID: `TASK-FT002-08`
- Status: `done`
- Wave: `W3`
- Feature: `FT-002`
- REQs: `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`
- Depends on: `TASK-FT002-04`, `TASK-FT002-05`, `TASK-FT002-06`, `TASK-FT002-07`
- Touched files: `tests/slices/checkout-payment/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, `.tasks/TASK-FT002-08/**/*`
- Tests: final backend unit/integration, frontend e2e smoke, Telegram auth/payment runtime contract tests and verify evidence bundle
- Verify: acceptance criteria из `FT-002` полностью покрыты tests/UAT, RTM остается согласованной, а Telegram-sensitive verification ограничена auth/payment runtime и transport evidence; real Mini App client-matrix coverage перенесена в `FT-009`
- Docs: `features/FT-002`, `requirements.md`, `changelog.md`, `runbooks/telegram-mini-app-verification.md` при необходимости
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`, `auth/payment runtime verify evidence`

## FT-003 — Language Selection And Localization

### Wave W1 — low-risk / foundation

### TASK-FT003-01 — Freeze language policy, persistence fallback and verify boundaries
- TASK-ID: `TASK-FT003-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`, `REQ-023`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-003-language-selection-and-localization.md`, `.memory-bank/tasks/plans/IMPL-FT-003.md`, `.memory-bank/contracts/mini-app-runtime-contract.md`, `.memory-bank/runbooks/telegram-mini-app-verification.md`, при необходимости `.memory-bank/testing/index.md`
- Tests: doc-level traceability review against `REQ-003`, `REQ-022`, `REQ-023`
- Verify: подтвердить, что default language policy, storage fallback order, post-auth profile sync boundary и Telegram-specific verify ownership явно зафиксированы и не конфликтуют с `FT-009`
- Docs: `features/FT-003`, `contracts/mini-app-runtime-contract.md`, `runbooks/telegram-mini-app-verification.md`, `tasks/plans/IMPL-FT-003`
- Normative Inputs: `FT-003`, `requirements.md`, `mini-app-runtime-contract.md`, `frontend-presentation-and-webview.md`, `testing/index.md`
- Constraints: не принимать `Telegram user.language_code` как trusted app setting без validated auth context

### TASK-FT003-02 — Scaffold shared i18n state, persistence helpers and overlay entrypoints
- TASK-ID: `TASK-FT003-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`
- Depends on: `TASK-FT003-01`
- Touched files: `frontend/src/shared/i18n/**/*`, `frontend/src/shared/lib/**/*`, `frontend/src/shared/state/**/*`, `frontend/src/shared/telegram/**/*`, `frontend/src/app/**/*`, `frontend/src/tests/**/*`
- Tests: frontend unit/contract test skeleton for language resolver, persistence adapter and overlay state
- Verify: repo содержит shared localization skeleton с явной orchestration boundary и без direct component-level `localStorage` / `Telegram.WebApp.*` access
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: localization остается technical enabling layer, а не отдельным business slice

### Wave W2 — core logic

### TASK-FT003-03 — Implement deterministic language resolution and storage fallback policy
- TASK-ID: `TASK-FT003-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`
- Depends on: `TASK-FT003-01`, `TASK-FT003-02`
- Touched files: `frontend/src/shared/i18n/**/*`, `frontend/src/shared/lib/**/*`, `frontend/src/shared/telegram/**/*`, `frontend/src/tests/**/*`
- Tests: unit tests for supported-language normalization and fallback-to-`ru`; contract tests for `DeviceStorage -> CloudStorage -> localStorage` read/write order
- Verify: unsupported, empty и поврежденные language values стабильно fallback-ятся на `ru`, а pre-auth persistence соблюдает deterministic order
- Docs: `features/FT-003`, `contracts/mini-app-runtime-contract.md`, `changelog.md`
- Verification Targets: language resolver, persistence helpers, Telegram storage adapter wrappers

### TASK-FT003-04 — Implement first-run overlay gating and authenticated language sync
- TASK-ID: `TASK-FT003-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`
- Depends on: `TASK-FT003-02`, `TASK-FT003-03`, `TASK-FT002-04`
- Touched files: `frontend/src/app/**/*`, `frontend/src/shared/state/**/*`, `frontend/src/shared/i18n/**/*`, `frontend/src/slices/catalog/**/*`, `frontend/src/slices/checkout-payment/**/*`, `backend/src/slices/checkout-payment/**/*`, `frontend/src/tests/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: UI/integration tests for mandatory overlay gating and backend integration tests for explicit language preference sync after auth
- Verify: customer-facing flow требует выбрать язык на чистом запуске, а после появления auth-контекста backend profile фиксирует explicit user choice как preferred language
- Docs: `features/FT-003`, `changelog.md`, при необходимости `requirements.md`
- Invariants: first-run language choice обязателен; backend profile становится source of truth после auth

### Wave W3 — integration & polish

### TASK-FT003-05 — Wire localized copy baseline into customer-facing routes
- TASK-ID: `TASK-FT003-05`
- Status: `done`
- Wave: `W3`
- Feature: `FT-003`
- REQs: `REQ-003`
- Depends on: `TASK-FT003-04`
- Touched files: `frontend/src/shared/i18n/**/*`, `frontend/src/slices/catalog/**/*`, `frontend/src/slices/checkout-payment/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/tests/**/*`
- Tests: route/page smoke for localized catalog and checkout copy plus language switch behavior
- Verify: catalog и checkout используют выбранный язык, а overlay/persistence не ломают existing customer journey
- Docs: `features/FT-003`, `changelog.md`
- Constraints: safe-area/theme/lifecycle UX не переносить в scope `FT-003`; это остается в `FT-009`

### TASK-FT003-06 — Add localization verification suite and Telegram evidence sync
- TASK-ID: `TASK-FT003-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT003-03`, `TASK-FT003-04`, `TASK-FT003-05`
- Touched files: `frontend/src/tests/**/*`, `tests/slices/checkout-payment/**/*`, `.memory-bank/features/FT-003-language-selection-and-localization.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, `.tasks/TASK-FT003-06/**/*`
- Tests: final frontend unit/contract/e2e smoke, backend integration for language sync, Telegram client-matrix evidence bundle
- Verify: acceptance criteria из `FT-003` полностью покрыты tests/UAT, RTM остается согласованной, а Telegram-specific evidence подтверждает overlay/persistence/sync без попытки закрыть shell baseline `FT-009`
- Docs: `features/FT-003`, `requirements.md`, `changelog.md`, `runbooks/telegram-mini-app-verification.md` при необходимости
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`, `Telegram runtime verify evidence`

## FT-004 — Courier Assignment

### Wave W1 — low-risk / foundation

### TASK-FT004-01 — Freeze assignment boundary, event semantics and targeted notification policy
- TASK-ID: `TASK-FT004-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-004-courier-assignment.md`, `.memory-bank/tasks/plans/IMPL-FT-004.md`, `.memory-bank/contracts/telegram-bot-contract.md`, `.memory-bank/contracts/api-events-baseline.md`, при необходимости `.memory-bank/states/order-lifecycle.md`
- Tests: doc-level traceability review against `REQ-007` and `REQ-018`
- Verify: подтвердить, что `CREATED -> ASSIGNED`, `order.assigned`, actor-targeted courier notification и audit/error contract явно зафиксированы и не конфликтуют с EP-002/RTM
- Docs: `features/FT-004`, `tasks/plans/IMPL-FT-004`, при необходимости `contracts/*`, `states/order-lifecycle.md`
- Normative Inputs: `FT-004`, `requirements.md`, `telegram-bot-contract.md`, `api-events-baseline.md`, `order-lifecycle.md`, `testing/index.md`

### TASK-FT004-02 — Scaffold backend delivery-assignment slice and persistence/test baseline
- TASK-ID: `TASK-FT004-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `TASK-FT004-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/delivery-assignment/**/*`, `backend/src/shared/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: backend test skeleton for assignment RBAC, state validation, audit/event integration
- Verify: repo содержит owning `delivery-assignment` slice skeleton и минимальный persistence/test harness без выноса assignment business rules в `shared`
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: ownership перехода `CREATED -> ASSIGNED` и assignment semantics остаются внутри `delivery-assignment`

### TASK-FT004-03 — Scaffold admin assignment route shell and frontend test harness
- TASK-ID: `TASK-FT004-03`
- Status: `done`
- Wave: `W1`
- Feature: `FT-004`
- REQs: `REQ-007`
- Depends on: `TASK-FT004-01`
- Touched files: `frontend/src/admin/**/*`, `frontend/src/tests/admin/**/*`, `frontend/src/app/**/*`, при необходимости `frontend/src/shared/ui/**/*`
- Tests: frontend/admin smoke skeleton for assignment page, form state and success/error rendering
- Verify: admin-web route shell для courier assignment существует и не втягивает login/session scope `FT-007` в текущую feature
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: auth/session implementation не дублировать во frontend slice `FT-004`; использовать existing or test-fixture auth boundary

### Wave W2 — core logic

### TASK-FT004-04 — Implement assignment command with RBAC, state validation, audit and event publication
- TASK-ID: `TASK-FT004-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `TASK-FT004-01`, `TASK-FT004-02`
- Touched files: `backend/src/slices/delivery-assignment/presentation/**/*`, `backend/src/slices/delivery-assignment/application/**/*`, `backend/src/slices/delivery-assignment/domain/**/*`, `backend/src/slices/delivery-assignment/infrastructure/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: integration tests for allowed admin role, invalid role, invalid order state, invalid courier target, audit writes and `order.assigned` event publication
- Verify: успешный assignment переводит заказ в `ASSIGNED`, пишет `order_status_history`/audit, публикует `order.assigned`; невалидные запросы возвращают controlled error contract без side effects
- Docs: `features/FT-004`, `requirements.md` при необходимости, `changelog.md`
- Verification Targets: assignment command endpoint, audit trail, `order.assigned`
- Invariants: assignment не обходит server-side state machine и не выполняется без auth/RBAC

### TASK-FT004-05 — Implement targeted courier notification integration for assignment
- TASK-ID: `TASK-FT004-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `TASK-FT004-01`, `TASK-FT004-02`, `TASK-FT004-04`
- Touched files: `backend/src/slices/delivery-assignment/application/**/*`, `backend/src/slices/delivery-assignment/infrastructure/**/*`, `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: integration/contract tests for actor-targeted dispatch to assigned courier and absence of broad broadcast default behavior
- Verify: `order.assigned` notification доставляется только назначенному курьеру через bot/runtime boundary и не меняет доменную семантику при retry/duplicate delivery
- Docs: `contracts/telegram-bot-contract.md` при необходимости, `features/FT-004`, `changelog.md`
- Constraints: transport/runtime layer не владеет assignment business rules; retry не создает повторный assignment side effect

### Wave W3 — integration & polish

### TASK-FT004-06 — Wire admin assignment UX to backend flow
- TASK-ID: `TASK-FT004-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `TASK-FT004-03`, `TASK-FT004-04`, `TASK-FT004-05`
- Touched files: `frontend/src/admin/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/tests/admin/**/*`
- Tests: UI/integration smoke for successful assignment, loading state, controlled error rendering and no duplicate submit side effect
- Verify: оператор может назначить курьера из admin-web UI и получает явное success/error confirmation по единому error contract
- Docs: `features/FT-004`, `changelog.md`

### TASK-FT004-07 — Add assignment verification suite and final docs sync
- TASK-ID: `TASK-FT004-07`
- Status: `done`
- Wave: `W3`
- Feature: `FT-004`
- REQs: `REQ-007`, `REQ-018`
- Depends on: `TASK-FT004-04`, `TASK-FT004-05`, `TASK-FT004-06`
- Touched files: `tests/slices/delivery-assignment/**/*`, `frontend/src/tests/admin/**/*`, `.memory-bank/features/FT-004-courier-assignment.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, `.tasks/TASK-FT004-07/**/*`
- Tests: final backend integration, admin assignment e2e smoke, targeted notification verify evidence bundle
- Verify: acceptance criteria из `FT-004` полностью покрыты tests/UAT, RTM остается согласованной, а assignment closure не размывает scope `FT-005` и `FT-007`
- Docs: `features/FT-004`, `requirements.md`, `changelog.md`, при необходимости `contracts/*`
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`, `assignment audit/event/notification verify evidence`

## FT-005 — Order Tracking And Events Polling

### Wave W1 — low-risk / foundation

### TASK-FT005-01 — Freeze delivery tracking state machine, polling contract and SLA verify boundary
- TASK-ID: `TASK-FT005-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`, `.memory-bank/tasks/plans/IMPL-FT-005.md`, `.memory-bank/contracts/api-events-baseline.md`, при необходимости `.memory-bank/states/order-lifecycle.md`, `.memory-bank/testing/index.md`
- Tests: doc-level traceability review against `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018`
- Verify: подтвердить, что post-assignment transitions, `409 CONFLICT`, ordered polling stream, string cursor contract и SLA ownership явно зафиксированы и не конфликтуют с EP-002/RTM
- Docs: `features/FT-005`, `tasks/plans/IMPL-FT-005`, при необходимости `contracts/*`, `states/order-lifecycle.md`, `testing/index.md`
- Normative Inputs: `FT-005`, `requirements.md`, `api-events-baseline.md`, `order-lifecycle.md`, `events-polling-and-bot-runtime.md`, `testing/index.md`

### TASK-FT005-02 — Scaffold backend delivery-tracking slice and test baseline
- TASK-ID: `TASK-FT005-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT005-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/delivery-tracking/**/*`, `backend/src/shared/**/*`, `tests/slices/delivery-tracking/**/*`
- Tests: backend test skeleton for state-machine transitions, history writes, event publication and polling cursor integration
- Verify: repo содержит owning `delivery-tracking` slice skeleton и execution-ready persistence/test harness без выноса lifecycle бизнес-правил в `shared`
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: ownership post-assignment transitions и `order_status_history` остается внутри `delivery-tracking`

### TASK-FT005-03 — Scaffold polling consumer and courier interaction harness
- TASK-ID: `TASK-FT005-03`
- Status: `done`
- Wave: `W1`
- Feature: `FT-005`
- REQs: `REQ-009`, `REQ-010`
- Depends on: `TASK-FT005-01`
- Touched files: `frontend/src/app/**/*`, `frontend/src/slices/order-tracking/**/*`, `frontend/src/tests/slices/order-tracking/**/*`, `backend/src/integrations/telegram-bot/**/*`
- Tests: smoke skeleton for polling consumer state, cursor advancement and courier interaction entrypoints
- Verify: repo содержит minimal polling consumer/runtime harness для downstream UI/bot integration без premature coupling к cancellation/review scopes
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: bot/runtime adapters не получают ownership state-machine rules; UI harness не дублирует backend transition logic

### Wave W2 — core logic

### TASK-FT005-04 — Implement courier status command flow with state validation and history/event writes
- TASK-ID: `TASK-FT005-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-018`
- Depends on: `TASK-FT005-01`, `TASK-FT005-02`, `TASK-FT004-04`
- Touched files: `backend/src/slices/delivery-tracking/presentation/**/*`, `backend/src/slices/delivery-tracking/application/**/*`, `backend/src/slices/delivery-tracking/domain/**/*`, `backend/src/slices/delivery-tracking/infrastructure/**/*`, `tests/slices/delivery-tracking/**/*`
- Tests: integration tests for valid transition chain, invalid transitions with `409 CONFLICT`, actor validation, `order_status_history` persistence, event publication and command response metadata
- Verify: courier может провести заказ только по разрешенной цепочке `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`; invalid transitions не меняют состояние и возвращают единый error contract
- Docs: `features/FT-005`, `requirements.md` при необходимости, `changelog.md`
- Verification Targets: `PATCH /orders/{id}/status`, `order_status_history`, status event publication
- Invariants: server-side state machine обязательна; каждый валидный transition пишет history и event

### TASK-FT005-05 — Implement ordered events polling with string cursors and duplicate-safe semantics
- TASK-ID: `TASK-FT005-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-005`
- REQs: `REQ-009`, `REQ-018`
- Depends on: `TASK-FT005-01`, `TASK-FT005-02`, `TASK-FT005-04`
- Touched files: `backend/src/slices/delivery-tracking/presentation/**/*`, `backend/src/slices/delivery-tracking/application/**/*`, `backend/src/slices/delivery-tracking/infrastructure/**/*`, `tests/slices/delivery-tracking/**/*`
- Tests: integration tests for ordered `revision`, string `cursor`/`next_cursor`, empty window behavior and duplicate polling requests with stable results
- Verify: `GET /events?since=<cursor>` возвращает ordered event stream по возрастанию `revision`, корректный string `next_cursor` и не ломает порядок/курсор при повторных запросах
- Docs: `features/FT-005`, `contracts/api-events-baseline.md` при необходимости, `changelog.md`
- Verification Targets: `GET /events?since=<cursor>`
- Constraints: event shape остается stable для future SSE/WS; polling read path не создает domain side effects

### TASK-FT005-06 — Implement status-change notifications and polling consumer wiring
- TASK-ID: `TASK-FT005-06`
- Status: `ready`
- Wave: `W2`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT005-03`, `TASK-FT005-04`, `TASK-FT005-05`
- Touched files: `backend/src/integrations/telegram-bot/**/*`, `backend/src/slices/delivery-tracking/application/**/*`, `frontend/src/slices/order-tracking/**/*`, `frontend/src/tests/slices/order-tracking/**/*`, `tests/slices/delivery-tracking/**/*`
- Tests: integration/contract tests for `order.status_changed` notification dispatch and frontend polling-consumer tests for ordered UI updates after resume/retry
- Verify: status changes доходят до релевантных участников через bot/runtime mapping, а polling consumers корректно применяют ordered updates без двойных side effects после reconnect
- Docs: `features/FT-005`, `contracts/telegram-bot-contract.md` при необходимости, `changelog.md`
- Constraints: transport/runtime слой не владеет transition business rules; resume/retry не должен дублировать write path

### Wave W3 — integration & polish

### TASK-FT005-07 — Add end-to-end delivery tracking and polling verification suite
- TASK-ID: `TASK-FT005-07`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT005-04`, `TASK-FT005-05`, `TASK-FT005-06`
- Touched files: `tests/slices/delivery-tracking/**/*`, `frontend/src/tests/slices/order-tracking/**/*`, `.tasks/TASK-FT005-07/**/*`, `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- Tests: final backend integration plus e2e smoke where courier drives order to `COMPLETED` and admin/customer consumers observe ordered events
- Verify: acceptance criteria по state machine, `409 CONFLICT`, history/event generation и ordered polling stream покрыты end-to-end evidence без выхода в cancellation scope `FT-006`
- Docs: `features/FT-005`, `changelog.md`, при необходимости `requirements.md`
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`

### TASK-FT005-08 — Collect polling SLA evidence and final docs sync
- TASK-ID: `TASK-FT005-08`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-005`
- REQs: `REQ-010`, `REQ-018`
- Depends on: `TASK-FT005-05`, `TASK-FT005-06`, `TASK-FT005-07`
- Touched files: `.tasks/TASK-FT005-08/**/*`, `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, при необходимости `.memory-bank/testing/index.md`
- Tests: polling load/latency verify script or operator evidence bundle plus final regression of ordered event contract
- Verify: polling SLA p95 <= 10 секунд подтвержден на agreed MVP load profile, RTM остается согласованной, а `FT-005` closure явно включает latency evidence помимо функциональных тестов
- Docs: `features/FT-005`, `requirements.md`, `changelog.md`, при необходимости `testing/index.md`
- Quality Gates: `integration`, `e2e smoke`, `polling SLA verify evidence`

## FT-006 — Operational Cancellation And Manual Refund

### Wave W1 — low-risk / foundation

### TASK-FT006-01 — Freeze cancellation policy, refund-state semantics and verify boundary
- TASK-ID: `TASK-FT006-01`
- Status: `ready`
- Wave: `W1`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`, `REQ-018`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`, `.memory-bank/tasks/plans/IMPL-FT-006.md`, при необходимости `.memory-bank/states/order-lifecycle.md`, `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`, `.memory-bank/testing/index.md`
- Tests: doc-level traceability review against `REQ-011`, `REQ-012`, `REQ-018`
- Verify: подтвердить, что allowed-role cancellation, cancellation statuses, `refund_status`/`refund_note` visibility, client prohibition и audit/error semantics явно зафиксированы и не конфликтуют с EP-002/RTM
- Docs: `features/FT-006`, `tasks/plans/IMPL-FT-006`, при необходимости `states/order-lifecycle.md`, `runbooks/manual-refund-and-negative-alerts.md`, `testing/index.md`
- Normative Inputs: `FT-006`, `requirements.md`, `order-lifecycle.md`, `manual-refund-and-negative-alerts.md`, `api-events-baseline.md`, `testing/index.md`

### TASK-FT006-02 — Scaffold backend order-cancellation slice and refund persistence/test baseline
- TASK-ID: `TASK-FT006-02`
- Status: `planned`
- Wave: `W1`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`, `REQ-018`
- Depends on: `TASK-FT006-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/order-cancellation/**/*`, `backend/src/shared/**/*`, `tests/slices/order-cancellation/**/*`
- Tests: backend test skeleton for allowed-role cancellation, refund-state persistence, audit/event integration
- Verify: repo содержит owning `order-cancellation` slice skeleton и execution-ready persistence/test harness без выноса cancellation/refund бизнес-правил в `shared`
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: cancellation actor/reason и refund-state ownership остаются внутри `order-cancellation`

### TASK-FT006-03 — Scaffold operator cancellation/refund route shell and frontend test harness
- TASK-ID: `TASK-FT006-03`
- Status: `planned`
- Wave: `W1`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`
- Depends on: `TASK-FT006-01`
- Touched files: `frontend/src/admin/**/*`, `frontend/src/tests/admin/**/*`, `frontend/src/app/**/*`, при необходимости `frontend/src/shared/ui/**/*`
- Tests: frontend/admin smoke skeleton for cancellation form, refund-state rendering and success/error feedback
- Verify: operator/admin route shell для cancellation/refund tracking существует и не втягивает unrelated review or auth implementation scope
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: auth/session logic не дублировать во frontend scope `FT-006`; использовать existing or fixture auth boundary

### Wave W2 — core logic

### TASK-FT006-04 — Implement authorized cancellation command with state validation and audit/event writes
- TASK-ID: `TASK-FT006-04`
- Status: `planned`
- Wave: `W2`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-018`
- Depends on: `TASK-FT006-01`, `TASK-FT006-02`, `TASK-FT004-04`, `TASK-FT005-04`
- Touched files: `backend/src/slices/order-cancellation/presentation/**/*`, `backend/src/slices/order-cancellation/application/**/*`, `backend/src/slices/order-cancellation/domain/**/*`, `backend/src/slices/order-cancellation/infrastructure/**/*`, `tests/slices/order-cancellation/**/*`
- Tests: integration tests for admin cancellation, courier unavailable-case cancellation, forbidden client/role attempts, invalid states, cancellation reason/actor persistence and cancellation event publication
- Verify: only allowed actors can cancel in allowed states; successful cancellation writes correct cancellation status, initiator, reason, audit/event data; invalid attempts return controlled error contract without side effects
- Docs: `features/FT-006`, `requirements.md` при необходимости, `changelog.md`
- Verification Targets: cancellation command endpoint, cancellation status transitions, audit trail, cancellation event publication
- Invariants: client never cancels; cancellation не обходит server-side state machine

### TASK-FT006-05 — Implement manual refund tracking state and note persistence
- TASK-ID: `TASK-FT006-05`
- Status: `planned`
- Wave: `W2`
- Feature: `FT-006`
- REQs: `REQ-012`, `REQ-018`
- Depends on: `TASK-FT006-01`, `TASK-FT006-02`, `TASK-FT006-04`
- Touched files: `backend/prisma/schema.prisma`, `backend/src/slices/order-cancellation/application/**/*`, `backend/src/slices/order-cancellation/domain/**/*`, `backend/src/slices/order-cancellation/infrastructure/**/*`, `tests/slices/order-cancellation/**/*`
- Tests: integration tests for paid cancellation -> `PENDING_MANUAL`, refund note persistence, transitions to `DONE/REJECTED`, and audit writes for manual refund updates
- Verify: paid cancelled orders never remain without visible refund tracking state; manual refund progress and notes persist explicitly and are auditable
- Docs: `features/FT-006`, `runbooks/manual-refund-and-negative-alerts.md` при необходимости, `changelog.md`
- Constraints: refund remains manual; no automated provider refund side effects

### TASK-FT006-06 — Wire operator cancellation and refund tracking UX to backend flow
- TASK-ID: `TASK-FT006-06`
- Status: `planned`
- Wave: `W2`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`, `REQ-018`
- Depends on: `TASK-FT006-03`, `TASK-FT006-04`, `TASK-FT006-05`
- Touched files: `frontend/src/admin/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/tests/admin/**/*`
- Tests: UI/integration smoke for allowed cancellation, forbidden cancellation messaging, refund-state rendering and manual refund note/status updates
- Verify: operator/admin UI показывает allowed/forbidden cancellation outcomes и явный refund tracking state без скрытых side effects
- Docs: `features/FT-006`, `changelog.md`

### Wave W3 — integration & polish

### TASK-FT006-07 — Add cancellation and refund verification suite
- TASK-ID: `TASK-FT006-07`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`, `REQ-018`
- Depends on: `TASK-FT006-04`, `TASK-FT006-05`, `TASK-FT006-06`
- Touched files: `tests/slices/order-cancellation/**/*`, `frontend/src/tests/admin/**/*`, `.tasks/TASK-FT006-07/**/*`, `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- Tests: final backend integration and e2e smoke for admin/courier allowed cancellation plus refund-state visibility
- Verify: acceptance criteria по allowed-role cancellation, client prohibition, cancellation actor/reason persistence, refund tracking и audit/event generation покрыты end-to-end evidence
- Docs: `features/FT-006`, `changelog.md`, при необходимости `requirements.md`
- Quality Gates: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`

### TASK-FT006-08 — Sync final refund runbook evidence and docs closure
- TASK-ID: `TASK-FT006-08`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-006`
- REQs: `REQ-012`, `REQ-018`
- Depends on: `TASK-FT006-05`, `TASK-FT006-06`, `TASK-FT006-07`
- Touched files: `.tasks/TASK-FT006-08/**/*`, `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, при необходимости `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- Tests: final refund tracking regression and operator evidence bundle for manual refund lifecycle
- Verify: final closure явно подтверждает manual refund workflow, RTM остается согласованной, а repo-local evidence показывает отсутствие cancelled paid orders без refund tracking state
- Docs: `features/FT-006`, `requirements.md`, `changelog.md`, при необходимости `runbooks/manual-refund-and-negative-alerts.md`
- Quality Gates: `integration`, `e2e smoke`, `manual refund verify evidence`

## FT-009 — Mini App Shell And WebView UX

### Wave W1 — low-risk / foundation

### TASK-FT009-01 — Freeze shell runtime, storage and verify boundaries
- TASK-ID: `TASK-FT009-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/tasks/plans/IMPL-FT-009.md`, `.memory-bank/contracts/mini-app-runtime-contract.md`, `.memory-bank/runbooks/telegram-mini-app-verification.md`, при необходимости `.memory-bank/testing/index.md`
- Tests: doc-level traceability review against `REQ-019`, `REQ-022`, `REQ-023`
- Verify: подтвердить, что `ready()/expand()`, safe-area, stable viewport, theme/lifecycle, centralized back/swipe policy и client-matrix ownership явно зафиксированы и не конфликтуют с уже выполненными `FT-002/FT-003`
- Docs: `features/FT-009`, `contracts/mini-app-runtime-contract.md`, `runbooks/telegram-mini-app-verification.md`, `tasks/plans/IMPL-FT-009`
- Normative Inputs: `FT-009`, `requirements.md`, `mini-app-runtime-contract.md`, `frontend-presentation-and-webview.md`, `testing/index.md`, `telegram-mini-app-verification.md`
- Constraints: не переносить checkout/localization domain logic в shell layer; `REQ-022` учитывать только в shared shell/storage boundary части

### TASK-FT009-02 — Scaffold app-level shell boundary and runtime test harness
- TASK-ID: `TASK-FT009-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`
- Depends on: `TASK-FT009-01`
- Touched files: `frontend/src/app/**/*`, `frontend/src/shared/telegram/**/*`, `frontend/src/shared/state/**/*`, `frontend/src/shared/styles/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`
- Tests: frontend unit/contract skeleton for shell state, runtime adapter events and app shell boundary
- Verify: repo содержит централизованный shell boundary/runtime scaffold без direct component-level `Telegram.WebApp.*` access и с execution-ready Jest coverage для shell primitives
- Docs: `tasks/backlog.md`, `changelog.md` при фактической реализации
- Constraints: shell остается technical enabling layer; не дублировать slice-specific orchestration в `shared`

- Next recommended action: закрытие `FT-009` завершено; переходить к следующей feature backlog wave.

### Wave W2 — core logic

### TASK-FT009-03 — Implement runtime adapter for theme, safe-area, stable viewport and lifecycle
- TASK-ID: `TASK-FT009-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-023`
- Depends on: `TASK-FT009-01`, `TASK-FT009-02`
- Touched files: `frontend/src/shared/telegram/**/*`, `frontend/src/shared/state/**/*`, `frontend/src/shared/styles/**/*`, `frontend/src/app/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/app/**/*`
- Tests: unit/contract tests for `ready()/expand()`, `isVersionAtLeast()`, theme/safe-area/viewport/lifecycle events and CSS variable propagation
- Verify: runtime adapter централизует Telegram WebApp event handling, использует `viewportStableHeight` как layout source of truth и не опирается на `env(safe-area-inset-*)` как основной baseline
- Docs: `features/FT-009`, `contracts/mini-app-runtime-contract.md`, `changelog.md`
- Verification Targets: runtime adapter wrappers, shell state transitions, stable viewport and safe-area CSS sync
- Invariants: `viewportHeight` не становится primary anchor; старые Telegram clients получают graceful fallback

### TASK-FT009-04 — Wire shell baseline into catalog and checkout UX
- TASK-ID: `TASK-FT009-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`
- Depends on: `TASK-FT009-02`, `TASK-FT009-03`, `TASK-FT002-07`, `TASK-FT003-05`
- Touched files: `frontend/src/app/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/shared/styles/**/*`, `frontend/src/slices/catalog/**/*`, `frontend/src/slices/checkout-payment/**/*`, `frontend/src/tests/app/**/*`, `frontend/src/tests/slices/catalog/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`
- Tests: route/page smoke for shell-wrapped catalog/checkout rendering, loader/disabled action feedback and centralized back/swipe policy wiring
- Verify: customer-facing catalog и checkout используют WebView-safe shell layout, visual confirmations и centralized shell policy без прямых Telegram runtime вызовов из slice-компонентов
- Docs: `features/FT-009`, `changelog.md`
- Constraints: business submit/auth/payment logic остается в owning slices; shell даёт только layout/runtime UX primitives

### Wave W3 — integration & polish

### TASK-FT009-05 — Add repo-local shell runtime verification suite
- TASK-ID: `TASK-FT009-05`
- Status: `done`
- Wave: `W3`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-023`
- Depends on: `TASK-FT009-03`, `TASK-FT009-04`
- Touched files: `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/slices/catalog/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/changelog.md`
- Tests: final repo-local unit/contract/runtime smoke for shell state, adapter events, catalog shell rendering and checkout visual feedback
- Verify: acceptance criteria из `FT-009` покрыты repo-local deterministic tests, а shell runtime evidence достаточно для перехода к реальному Telegram client-matrix verify
- Docs: `features/FT-009`, `changelog.md`, при необходимости `testing/index.md`
- Quality Gates: `typecheck`, `unit`, `contract/runtime`, `route/page smoke`

### TASK-FT009-06 — Sync Telegram client-matrix evidence and final shell docs closure
- TASK-ID: `TASK-FT009-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-03`, `TASK-FT009-04`, `TASK-FT009-05`
- Touched files: `.tasks/TASK-FT009-06/**/*`, `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/requirements.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md`, `.memory-bank/runbooks/telegram-mini-app-verification.md`
- Tests: final repo-local shell/runtime suite, Telegram test environment usage где применимо, и mandatory real `Android Telegram` operator-confirmed evidence с customer-facing checkout UI
- Verify: acceptance criteria из `FT-009` полностью покрыты tests/UAT, RTM остается согласованной, а shared shell/runtime closure для `REQ-019`, `REQ-022`, `REQ-023` явно подтверждена Android run notes; screenshots/videos optional
- Docs: `features/FT-009`, `requirements.md`, `changelog.md`, `runbooks/telegram-mini-app-verification.md`, `index.md`
- Quality Gates: `lint`, `typecheck`, `unit`, `contract/runtime`, `route/page smoke`, `Android Telegram runtime notes`

## Conventions
Each task should include:
- goal
- expected touched files
- tests
- verification steps
- docs-first update

## Task state model
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Depends on: TASK-... | none`

## Task card template
### TASK-001 — short title
- TASK-ID: TASK-001
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: `src/...`, `tests/...`
- Tests: `npm test -- foo`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
