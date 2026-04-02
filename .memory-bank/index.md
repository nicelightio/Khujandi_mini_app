---
description: Главная карта знаний проекта (table of contents) для агентов.
status: active
---
# Memory Bank Index

## Навигация

- [.memory-bank/mbb/index.md](mbb/index.md): Правила ведения Memory Bank (MBB).
- [.memory-bank/product.md](product.md): Продукт (C4 L1).
- [.memory-bank/requirements.md](requirements.md): Требования + RTM.
- [.memory-bank/epics/index.md](epics/index.md): Эпики MVP (C4 L2) и их scope.
- [.memory-bank/features/index.md](features/index.md): Feature-спеки MVP (C4 L3) для `/prd-to-tasks`.
- [.memory-bank/tasks/backlog.md](tasks/backlog.md): Backlog / waves.

- [.memory-bank/spec-index.md](spec-index.md): Реестр normative docs и маршрутизация по source-of-truth.
- [.memory-bank/glossary.md](glossary.md): Общий словарь терминов и доменных значений.
- [.memory-bank/invariants.md](invariants.md): Глобальные MUST/NEVER правила.
- [.memory-bank/architecture/index.md](architecture/index.md): Duo + boundaries (WHAT/WHY).
- [.memory-bank/diagrams/index.md](diagrams/index.md): ASCII-схемы для быстрого входа в контекст по specs, коду и runtime.
- [.memory-bank/guides/index.md](guides/index.md): Valid HOW docs для использования, запуска и troubleshooting.
- [.memory-bank/adrs/index.md](adrs/index.md): ADR решения.

- [.memory-bank/contracts/index.md](contracts/index.md): Контракты и boundary specs (prefer when present).
- [.memory-bank/states/index.md](states/index.md): Lifecycle/state rules (prefer when present).
- [.memory-bank/runbooks/index.md](runbooks/index.md): Runbooks и operational procedures.
- [.memory-bank/testing/index.md](testing/index.md): Testing strategy.
- [.memory-bank/workflows/index.md](workflows/index.md): Execution/workflow docs для task loop и MB sync.
- [.memory-bank/skills/index.md](skills/index.md): Skill registry.
- [.memory-bank/bugs/index.md](bugs/index.md): Bug records и verification failures.

## Recent updates

- Telegram Mini App docs sync stabilized: временный research artifact удален, routing cleanup завершен, а новые `contracts/runbooks/diagrams` остались в роли нормативного и derived spec-layer.
- `FT-001`: contract layer extended with `catalog-public-api` and `seller-catalog-write-policy` for docs-first implementation.
- `FT-001`: backend `catalog` scaffold, Prisma baseline, and backend test skeleton added for `TASK-FT001-02`.
- `FT-001`: frontend `catalog` scaffold and public route shell added for `TASK-FT001-03`.
- `FT-001`: backend public browse read path for `shops/products` is implemented and verified via `TASK-FT001-04`.
- `FT-001`: seller-scoped shop writes and rename marker logic are implemented and verified via `TASK-FT001-05`.
- `FT-001`: seller-scoped product writes with shop linkage validation are implemented and verified via `TASK-FT001-06`.
- `FT-001`: frontend public catalog route now loads backend browse data and covers loading/empty/error states via `TASK-FT001-07`.
- `FT-001`: repo-local frontend route/page smoke coverage now verifies public catalog rendering for `TASK-FT001-07`.
- `FT-001`: final verification/docs sync completed in `TASK-FT001-08`, and RTM for `REQ-001/002/020` is now marked `done`.
- `FT-001`: repo-local backend Jest runner for catalog specs was added via `TASK-FT001-09` and now underpins backend verification.
- `FT-002`: implementation plan, protocol docs and execution-ready backlog decomposition were added for checkout/payment, Telegram auth and paid-only order creation.
- `FT-003`: implementation plan, protocol docs and execution-ready backlog decomposition were added for first-run language overlay, persistence fallback and post-auth language sync.
- `FT-002`: backend `checkout-payment` scaffold, Prisma order/payment baseline, and backend test skeleton were added and passed delegated verification via `TASK-FT002-02`.
- `FT-002`: frontend `checkout-payment` route shell, slice scaffold, and frontend smoke coverage were added and passed delegated verification via `TASK-FT002-03`.
- `FT-002`: backend Telegram auth validation, replay guard, and HttpOnly cookie session metadata were implemented and verified via `TASK-FT002-04`.
- `FT-002`: backend trusted payment finalization now verifies provider/source trust, creates paid orders idempotently, and is verified via `TASK-FT002-05`.
- `FT-002`: backend payment failure paths now return retry-safe controlled errors without order side effects and are verified via `TASK-FT002-06`.
- `FT-002`: frontend checkout route now initiates Telegram auth plus backend checkout flow, surfaces retryable failures, and is verified via `TASK-FT002-07`.
- `FT-002`: final repo-local verification/docs sync is complete via `TASK-FT002-08`, and RTM for `REQ-005`, `REQ-006`, and `REQ-021` is now marked `done` while real checkout client-matrix evidence remains deferred to `FT-009`.
- `FT-002`: app router now resolves the current pathname so `/checkout` renders the checkout flow instead of always falling back to catalog.
- `FT-002`: Telegram auth replay guard and Mini App session issuance now execute atomically, preventing duplicate sessions and stray `500` responses under concurrent retries.
- `FT-003`: docs-first language policy and verify ownership are frozen via `TASK-FT003-01`.
- `FT-003`: shared localization runtime scaffold now exists for language normalization, persistence orchestration, Telegram storage adapter ownership, and app-level overlay entrypoints via `TASK-FT003-02`.
- `FT-003`: deterministic language resolution, fail-safe storage fallback, and Telegram storage adapter wrappers are implemented and verified via `TASK-FT003-03`.
- `FT-003`: first-run language overlay now fully gates customer-facing routes, and checkout auth synchronizes explicit language choice into backend profile state via `TASK-FT003-04`.
- `FT-003`: customer-facing overlay, catalog, and checkout baseline copy now render in the selected language and are repo-locally verified via `TASK-FT003-05`.
- `FT-003`: final repo-local localization verification is complete via `TASK-FT003-06`, so `REQ-003` is now `done` while shared `REQ-022/023` shell/client-matrix closure remains with `FT-009`.
- `FT-009`: implementation plan, protocol docs and execution-ready backlog decomposition were added for Telegram Mini App shell/runtime baseline, WebView UX hardening and final client-matrix verification.
- `FT-009`: repo-local shell/runtime implementation reached `TASK-FT009-06`, but final closure is blocked by missing real `Android Telegram` evidence, now tracked via an active bug record.
- `FT-009`: current verification policy was narrowed to mandatory real `Android Telegram` evidence; `iOS/Desktop` coverage is now optional hardening and no longer blocks current task closure.
- Added a dedicated VPS + Cloudflare + Telegram test-server runbook for first real Android Mini App launches on `tgmeal.natureonzoom.win`.
- `FT-009`: docs-first shell/runtime ownership, shared storage boundary, and verification routing were frozen via `TASK-FT009-01`, unlocking app-level shell scaffolding in `TASK-FT009-02`.
- `FT-009`: app-level shell boundary, shared shell state/context scaffold, and runtime bridge test harness are now in place via `TASK-FT009-02`, unlocking runtime event implementation in `TASK-FT009-03`.
- `FT-009`: runtime adapter wiring for `ready()/expand()`, theme, safe-area, stable viewport, lifecycle, and shell CSS variable propagation is complete via `TASK-FT009-03`, unlocking slice-level UX integration in `TASK-FT009-04`.
- `FT-009`: deterministic repo-local shell/runtime verification now covers adapter events, shell state, catalog shell rendering, and checkout action feedback via `TASK-FT009-05`; the remaining step is real `Android Telegram` evidence in `TASK-FT009-06`.

## Current MVP map

- `EP-001`: клиентский путь от public catalog до оплаченного заказа, включая обязательную локализацию.
- `EP-002`: операционный delivery flow: assignment, tracking, polling, cancellation, refund tracking.
- `EP-003`: отдельный security/auth контур веб-админки.
- `EP-004`: post-delivery feedback loop и negative alerts.
