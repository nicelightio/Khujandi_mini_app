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
- `FT-002`: final repo-local verification/docs sync is complete via `TASK-FT002-08`, and RTM for `REQ-005`, `REQ-006`, and `REQ-021` is marked `done`; shared customer-facing Telegram runtime evidence is now additionally closed in `FT-009`.
- `FT-002`: app router now resolves the current pathname so `/checkout` renders the checkout flow instead of always falling back to catalog.
- `FT-002`: Telegram auth replay guard and Mini App session issuance now execute atomically, preventing duplicate sessions and stray `500` responses under concurrent retries.
- `FT-003`: docs-first language policy and verify ownership are frozen via `TASK-FT003-01`.
- `FT-003`: shared localization runtime scaffold now exists for language normalization, persistence orchestration, Telegram storage adapter ownership, and app-level overlay entrypoints via `TASK-FT003-02`.
- `FT-003`: deterministic language resolution, fail-safe storage fallback, and Telegram storage adapter wrappers are implemented and verified via `TASK-FT003-03`.
- `FT-003`: first-run language overlay now fully gates customer-facing routes, and checkout auth synchronizes explicit language choice into backend profile state via `TASK-FT003-04`.
- `FT-003`: customer-facing overlay, catalog, and checkout baseline copy now render in the selected language and are repo-locally verified via `TASK-FT003-05`.
- `FT-003`: final repo-local localization verification is complete via `TASK-FT003-06`, and the shared `REQ-022/023` Telegram-sensitive closure is now also closed by `FT-009`.
- `FT-004`: implementation plan, protocol docs and execution-ready backlog decomposition were added for courier assignment, `CREATED -> ASSIGNED` ownership, `order.assigned` semantics and targeted courier notification.
- `FT-004`: docs-first assignment boundary, `order.assigned` event semantics, and courier-targeted notification policy are frozen via `TASK-FT004-01`.
- `FT-004`: backend `delivery-assignment` scaffold, Prisma persistence baseline, and backend test harness are added and verified via `TASK-FT004-02`.
- `FT-004`: separate `admin-web` assignment route shell and frontend smoke harness are now in place via `TASK-FT004-03` without pulling `FT-007` login/session scope into the slice.
- `FT-004`: backend assignment command now enforces auth/RBAC plus `CREATED -> ASSIGNED`, writes order history/audit, publishes canonical `order.assigned`, and keeps invalid requests side-effect free via `TASK-FT004-04`.
- `FT-004`: targeted courier bot notification now dispatches only to the assigned courier and keeps transport failures duplicate-safe relative to assignment side effects via `TASK-FT004-05`.
- `FT-004`: admin-web assignment submit flow now calls the backend command path, surfaces controlled success/error feedback, and blocks duplicate submit side effects via `TASK-FT004-06` while keeping `FT-007` auth/session ownership out of scope.
- `FT-004`: final repo-local verification/docs sync is complete via `TASK-FT004-07`; `REQ-007` and the `FT-004` `REQ-018` trace row are now `done`, while post-assignment lifecycle and admin auth/session ownership remain with `FT-005` and `FT-007`.
- `FT-005`: implementation plan, protocol docs and execution-ready backlog decomposition were added for delivery tracking, ordered event polling, `409 CONFLICT` state-machine enforcement and SLA verification.
- `FT-005`: docs-first state-machine, polling cursor contract, `409 CONFLICT`, and SLA verification ownership are frozen via `TASK-FT005-01`, unlocking backend/frontend scaffold tasks.
- `FT-005`: backend `delivery-tracking` scaffold, slice-owned persistence wiring, and backend test baseline are added via `TASK-FT005-02`, unlocking the courier status command task while keeping RTM rows planned until runtime behavior lands.
- `FT-005`: frontend `order-tracking` polling-consumer scaffold and transport-only courier bot harness are added via `TASK-FT005-03`, keeping runtime adapters out of state-machine ownership and leaving `REQ-009/010` open for later runtime/SLA tasks.
- `FT-005`: backend courier status command now enforces authenticated courier ownership plus adjacent transitions, writes `order_status_history` and `order.status_changed`, and returns polling-friendly `updatedAt`/`revision` via `TASK-FT005-04`, unlocking ordered polling work in `TASK-FT005-05` while RTM rows remain open pending later runtime closure.
- `FT-005`: backend ordered polling now returns stable event objects with string `revision` / `nextCursor`, preserves ascending event order, and keeps duplicate polling read-side effect free via `TASK-FT005-05`, unlocking notification/runtime wiring in `TASK-FT005-06` while RTM rows remain open pending later feature/SLA closure.
- `FT-005`: committed status changes now fan into Telegram courier notifications via slice-owned notifier wiring, while the frontend polling consumer dedupes command-confirmed revisions across interval retries/resume and keeps action labels aligned with ordered event state via `TASK-FT005-06`; `TASK-FT005-07` is now ready and RTM rows stay open pending final end-to-end closure.
- `FT-005`: final repo-local functional verification is complete via `TASK-FT005-07`; backend/frontend tests now cover the courier path to `COMPLETED`, ordered polling observation, and `409 CONFLICT`/history/event evidence, so `REQ-008`, `REQ-009`, and the `FT-005` `REQ-018` row are `done`, while `REQ-010` remains with `TASK-FT005-08`.
- `FT-005`: final SLA closure is complete via `TASK-FT005-08`; the new repo-local polling harness measured `p95 = 4500 ms` and `max = 4750 ms` across the current 5-second polling cadence, so `REQ-010` is now `done` and `FT-005` is fully closed.
- `FT-006`: implementation plan, protocol docs and execution-ready backlog decomposition were added for operational cancellation, allowed-role policy, manual refund tracking and final refund evidence sync.
- `FT-006`: docs-first cancellation policy, refund-state semantics (`NOT_REQUIRED/PENDING_MANUAL/DONE/REJECTED`), and verify boundary are now frozen via `TASK-FT006-01`.
- `FT-006`: backend `order-cancellation` scaffold, slice-owned cancellation/refund persistence baseline, and repo-local Jest harness are now in place via `TASK-FT006-02`, unlocking `TASK-FT006-04` while RTM rows stay open pending runtime behavior and final evidence.
- `FT-006`: admin-web cancellation/refund route shell, explicit refund-state placeholder rendering, and repo-local admin frontend smoke coverage are now in place via `TASK-FT006-03` without pulling `FT-007` auth/session or review flow scope into the slice.
- `FT-006`: backend cancellation command now enforces allowed-role/state policy, assigned-courier unavailable-case rules, and transactional order/history/audit/event writes via `TASK-FT006-04`; `TASK-FT006-05` is now unblocked while RTM rows stay `planned` until refund progression, UI wiring, and final verify evidence land.
- `FT-006`: backend manual refund progression now enforces cancelled paid-order `PENDING_MANUAL -> DONE/REJECTED`, persists required operator notes, and publishes audit/event artifacts via `TASK-FT006-05`; `TASK-FT006-06` is now ready while RTM rows remain open pending UI wiring and final verify evidence.
- `FT-006`: admin-web cancellation/refund route now calls explicit backend command paths, renders controlled forbidden/error outcomes, keeps refund-state/note visibility after submit, and blocks duplicate submit side effects via `TASK-FT006-06`; `TASK-FT006-07` is now ready while RTM rows remain open pending final verification evidence.
- `FT-006`: final repo-local verification suite now covers allowed admin/courier cancellation outcomes, client prohibition, actor/reason persistence, explicit refund-state visibility, and cancellation/refund audit-event evidence via `TASK-FT006-07`; `REQ-011` is now `done`, `TASK-FT006-08` is `ready`, and refund/runbook closure remains with the final evidence-sync task.
- `FT-006`: final refund runbook evidence and docs closure are complete via `TASK-FT006-08`; manual refund workflow confirmation is now explicit in the runbook/spec layer, and `REQ-012` plus the `FT-006` `REQ-018` RTM row are `done`.
- `FT-007`: implementation plan, protocol docs and execution-ready backlog decomposition were added for admin auth, lockout policy, session lifetime enforcement and auth audit closure.
- `FT-007`: docs-first auth freeze is complete via `TASK-FT007-01`; MVP now explicitly fixes boss-controlled out-of-band provisioning and HTTPS-only HttpOnly cookie transport for admin sessions.
- `FT-007`: backend `admin-access` scaffold, Prisma credentials/session/audit baseline, and repo-local unit/integration harness are now in place via `TASK-FT007-02`, unlocking backend login/runtime work in `TASK-FT007-04` without moving auth invariants into `shared`.
- `FT-007`: admin-web login route, shared protected shell, and frontend smoke harness are now in place via `TASK-FT007-03`, keeping auth policy centralized and leaving runtime login/refresh/logout behavior to later backend/frontend tasks.
- `FT-007`: backend login now authenticates provisioned admins, writes `login_success/login_failed/locked` audit events, creates hashed refresh-session baseline records, and returns controlled `401/429` outcomes via `TASK-FT007-04`; refresh/logout lifetime enforcement is now the next unlocked step.
- `FT-007`: refresh rotation, logout revocation, idle-timeout expiry, and fixed 3-day session lifetime are now implemented in `admin-access` via `TASK-FT007-05`; lockout also revokes active session chains, and `TASK-FT007-06` is now `ready` for admin-web UX wiring.
- `FT-007`: admin-web now uses one shared cookie-based auth boundary for login, refresh restore, protected-route fallback, and logout across assignment/cancellation pages via `TASK-FT007-06`.
- `FT-007`: final repo-local verification/docs sync is complete via `TASK-FT007-07`; `REQ-015`, `REQ-016`, `REQ-017`, and the `FT-007` `REQ-018` row are now `done`.
- `FT-008`: implementation plan, protocol docs and execution-ready backlog decomposition were added for two-sided bot reviews, duplicate-safe review submission and negative alert escalation.
- `FT-008`: docs-first review payload boundary, `COMPLETED` activation gate, duplicate-safe negative alert semantics, and verify ownership are now frozen via `TASK-FT008-01`.
- `FT-008`: backend `reviews-feedback` scaffold, Prisma `Review` baseline, and repo-local Jest harness are now in place via `TASK-FT008-02`, unlocking backend review command work in `TASK-FT008-04` while RTM rows remain open pending runtime behavior and final verification.
- `FT-008`: transport-only Telegram review prompts, callback parsing, and unique-target negative alert harness are now in place via `TASK-FT008-03`, leaving completed-only review submission and canonical `review.negative` publication to later runtime tasks.
- `FT-008`: completed-only review submission now validates actor/direction ownership, persists structured review payloads, and keeps duplicate bot replay side-effect free via `TASK-FT008-04`, so `TASK-FT008-05` is now ready while `REQ-013` / `REQ-014` remain open pending low-rating publication, bot flow wiring, and final verification.
- `FT-008`: low-rating reviews now publish canonical `review.negative`, resolve active admin Telegram targets inside the owning slice boundary, and fan out duplicate-safe alerts via `TASK-FT008-05`; `TASK-FT008-06` is now ready while RTM rows remain open pending bot-guided flow wiring and final verification.
- `FT-008`: bot-guided client and courier review runtime is now wired via `TASK-FT008-06`, so both sides advance through `rating -> reason_code -> comment(optional)` and submit through the owning backend path; `TASK-FT008-07` is now ready for final verification/docs/RTM closure.
- `FT-008`: final repo-local verification/docs sync is complete via `TASK-FT008-07`; two-sided bot review evidence, courier/client low-rating alert fan-out, and RTM closure for `REQ-013/014` are now done.
- `FT-008`: stale Telegram review callbacks are now rejected with revision-aware step validation via `TASK-FT008-08`, keeping intermediate bot-step replay side-effect free without changing final-submit idempotency.
- `FT-008`: adversarial verification on `TASK-FT008-08` correctly identified draft durability as the remaining follow-up, and that runtime gap is now closed by `TASK-FT008-09`.
- `FT-008`: review drafts now persist in slice-owned durable storage with explicit `1 hour` TTL via `TASK-FT008-09`, so restart/redeploy and shared-DB multi-instance hops no longer rely on implicit in-memory state.
- `FT-008`: `red-verify` for `TASK-FT008-09` did not find a semantic break in the review flow, but left a follow-up `TASK-FT008-10` for checked-in Prisma rollout/retention closure before calling the durability path fully risk-closed.
- `FT-008`: `TASK-FT008-10` added checked-in Prisma rollout artifacts for `ReviewDraft` and explicit expired-draft cleanup policy, so the durability path is now operationally deployable instead of relying on implicit rollout/retention assumptions.
- Semantic review after PR `#6` opened three follow-ups: `TASK-FT007-08` for the missing real admin HTTP cookie auth boundary, `TASK-FT008-08` for stale Telegram review callback hardening, and `TASK-FT008-09` for making review-draft runtime guarantees explicit instead of implicit.
- `FT-007`: `TASK-FT007-08` added the admin HTTP cookie auth boundary and transport enforcement, but `red-verify` found that the handler was still test-mounted only.
- `FT-007`: `TASK-FT007-09` mounted that handler into the checked-in repo-local backend runtime used by `dev:api` and the Vite `/api` proxy, so local/dev login/refresh/logout now hit the real mounted runtime instead of a test-only server shell.
- Ops: added a containerized deploy path for the same `tgmeal.natureonzoom.win` VPS, with checked-in `Dockerfile.web`, `Dockerfile.api`, `docker-compose.yml`, and a dedicated runbook for replacing the older non-container app copy.
- Ops: deployment specs are now split explicitly into architecture (`deployment-and-runtime-topology`), practical guide (`server-deploy-and-rollout`), and canonical VPS runbook (`telegram-mini-app-container-deploy`), so server rollout is documented as a first-class project concern rather than scattered notes.
- `FT-009`: implementation plan, protocol docs and execution-ready backlog decomposition were added for Telegram Mini App shell/runtime baseline, WebView UX hardening and final client-matrix verification.
- `FT-009`: current verification policy accepts operator-confirmed real `Android Telegram` notes as the blocking closure artifact; screenshots/videos are optional hardening only.
- Added a dedicated VPS + Cloudflare + Telegram test-server runbook for first real Android Mini App launches on `tgmeal.natureonzoom.win`.
- `FT-009`: docs-first shell/runtime ownership, shared storage boundary, and verification routing were frozen via `TASK-FT009-01`, unlocking app-level shell scaffolding in `TASK-FT009-02`.
- `FT-009`: app-level shell boundary, shared shell state/context scaffold, and runtime bridge test harness are now in place via `TASK-FT009-02`, unlocking runtime event implementation in `TASK-FT009-03`.
- `FT-009`: runtime adapter wiring for `ready()/expand()`, theme, safe-area, stable viewport, lifecycle, and shell CSS variable propagation is complete via `TASK-FT009-03`, unlocking slice-level UX integration in `TASK-FT009-04`.
- `FT-009`: final closure is complete via `TASK-FT009-06`; repo-local shell/runtime verification and operator-confirmed Android Telegram runs now close `REQ-019`, shared `REQ-022`, and `REQ-023`.

## Current MVP map

- `EP-001`: клиентский путь от public catalog до оплаченного заказа, включая обязательную локализацию.
- `EP-002`: операционный delivery flow: assignment, tracking, polling, cancellation, refund tracking.
- `EP-003`: отдельный security/auth контур веб-админки.
- `EP-004`: post-delivery feedback loop и negative alerts.
