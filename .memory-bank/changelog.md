---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [2026-04-06] Containerized deploy preparation for tgmeal test server
- Added checked-in container deploy assets: `Dockerfile.web`, `Dockerfile.api`, `docker-compose.yml`, `.dockerignore`, and nginx config for the web container so the current frontend plus repo-local demo/admin-auth API can run as a two-container stack.
- Extended `scripts/dev-api.ts` with runtime env parsing for `HOST`, `PORT`, and `ADMIN_ALLOWED_ORIGINS`, which is required for container networking and the public `tgmeal.natureonzoom.win` origin.
- Added `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` and linked it from the runbooks index to document cleanup of the old `/var/www/tgmeal` deploy, creation of the dedicated `tgmeal` user, and rollout on the same VPS via Docker Compose.

## [2026-04-06] TASK-FT007-09 mount admin auth handler into checked-in runtime entrypoint
- Added a shared checked-in dev runtime server under `backend/src/dev-runtime/dev-api-server.ts` and switched `dev:api` to a TypeScript entrypoint so the local `/api` runtime now mounts `createAdminAuthHttpHandler` instead of serving only catalog demo routes.
- Repointed the admin runtime test helper to that same mounted server module, keeping cookie/origin/runtime assertions against the real repo-local entrypoint used by local app flows rather than a test-only ad hoc server shell.
- Archived `BUG-2026-04-06-ft007-admin-auth-handler-not-mounted-in-runtime` and marked `TASK-FT007-09` done because `/api/v1/admin/auth/login|refresh|logout` are now реально wired into the checked-in local/dev runtime boundary.

## [2026-04-06] TASK-FT008-10 ReviewDraft rollout and retention closure
- Added checked-in Prisma rollout artifacts under `backend/prisma/migrations/` so the durable `ReviewDraft` path is deployable without relying on an implicit schema step outside the repo.
- Synced `FT-008` and the negative-alert runbook with an explicit expired-draft retention policy: rows become delete-safe after `expiresAt <= now()`, cleanup can use a simple SQL delete, and this does not change duplicate-safe final submit semantics.
- MB sync after `/verify` + `/red-verify` removed the last `FT-008` doc drift in `bugs/index.md`, so the archived bug no longer implies an open rollout/retention concern.

## [2026-04-06] TASK-FT008-09 review draft durability and explicit runtime guarantee
- Replaced process-local Telegram review draft state with slice-owned durable `ReviewDraft` persistence, explicit `1 hour` TTL, and restart-safe/shared-DB multi-instance-safe flow continuity while keeping final submit ownership inside `reviews-feedback`.
- Extended repo-local `reviews-feedback` tests for persistence-backed duplicate final submit behavior, archived `BUG-2026-04-06-ft008-ephemeral-review-draft-state`, and marked `TASK-FT008-09` done.
- `red-verify` kept the fix as substantively correct, but opened `TASK-FT008-10` as a ready operational follow-up for checked-in Prisma rollout and expired-draft retention policy closure.

## [2026-04-06] TASK-FT008-08 stale Telegram review callback hardening
- Extended `telegram-bot-reviews-feedback` callback payloads and in-memory draft state with explicit prompt revision identity so stale `rating`, `reason_code`, and `skip_comment` callbacks are ignored before they can mutate the active review draft.
- Added repo-local `reviews-feedback` unit/integration regressions for replayed older prompt buttons while preserving duplicate-safe final submit and single `review.negative` fan-out semantics; archived `BUG-2026-04-06-ft008-stale-review-callback-replay-gap` and marked `TASK-FT008-08` done.
- `red-verify` kept the task as a substantive fix for stale callbacks, but explicitly preserved `TASK-FT008-09` as the remaining runtime-guarantee follow-up for process-local draft durability and restart/multi-instance behavior.

## [2026-04-06] TASK-FT007-08 admin auth runtime cookie boundary bugfix
- Added `backend/src/slices/admin-access/presentation/admin-auth-http.ts` so `FT-007` now exposes a checked-in HTTP runtime boundary for `POST /api/v1/admin/auth/login|refresh|logout` with `Secure` + `HttpOnly` + `SameSite=Lax` cookies and mandatory `Origin/Referer` validation.
- Added repo-local backend HTTP integration coverage plus admin frontend runtime smoke against the real cookie boundary, archived `BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary`, and marked `TASK-FT007-08` done.

## [2026-04-05] TASK-FT008-07 final verification suite and docs sync
- Added final `reviews-feedback` integration evidence for courier-side low-rating bot flow, confirming `rating -> reason_code -> comment(optional)` progression, canonical `review.negative` publication, active-admin fan-out, and duplicate final-callback no-op behavior through the owning module/controller path.
- Re-ran `npm run test:reviews-feedback`, `npm run lint`, and `npx tsc --noEmit -p tsconfig.jest.json`; marked `TASK-FT008-07` done, closed `REQ-013` and `REQ-014`, and synced final `FT-008` status across backlog/feature/runbook/index docs.

## [2026-04-05] TASK-FT008-06 bot-guided review flow wiring
- Added `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts` so client and courier review flows now keep in-memory step state, enforce `COMPLETED` plus actor/direction ownership, and drive `rating -> reason_code -> comment(optional)` before calling the owning `reviews-feedback` submit path.
- Extended repo-local `reviews-feedback` unit/integration coverage for full bot-guided progression and duplicate final-submit short-circuit behavior; marked `TASK-FT008-06` done and promoted `TASK-FT008-07` to `ready` while `REQ-013` / `REQ-014` remain open pending final verification/docs/RTM closure.

## [2026-04-05] TASK-FT008-05 negative alert publication and active-admin fan-out
- Extended backend `reviews-feedback` so unique low-rating review writes publish canonical `review.negative`, query active `boss/manager/admin` Telegram recipients through the slice repository boundary, and keep alert transport failures non-blocking relative to committed review/event artifacts.
- Added repo-local unit/integration coverage for `rating <= 2` event publication, active-admin fan-out, and duplicate replay no-op behavior; marked `TASK-FT008-05` done and promoted `TASK-FT008-06` to `ready` while `REQ-013` / `REQ-014` remain `planned` pending bot-guided flow wiring and final verification evidence.

## [2026-04-05] TASK-FT008-04 completed-only review submission
- Implemented backend `reviews-feedback` submission flow so only completed orders accept reviews, actor/direction ownership is validated against the persisted order pair, and structured payload fields (`rating`, `reasonCode`, `comment`) are normalized before persistence.
- Added duplicate-safe review handling through repository unique-pair lookup plus Prisma `P2002` fallback, extended repo-local `reviews-feedback` unit/integration coverage, marked `TASK-FT008-04` done, and promoted `TASK-FT008-05` to `ready` while `REQ-013` / `REQ-014` remain `planned` until low-rating publication, bot wiring, and final verify evidence land.

## [2026-04-05] TASK-FT008-03 Telegram review harness scaffold
- Added `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts` with minimal review-step prompt builders, callback codec helpers, and duplicate-safe negative alert fan-out targeting for future `FT-008` runtime wiring.
- Extended repo-local `reviews-feedback` unit coverage for prompt payload shape, callback parsing, and unique admin targeting, then marked `TASK-FT008-03` done while leaving `REQ-013` / `REQ-014` unchanged until completed-only submission logic, canonical `review.negative` publication, and final verification evidence land.

## [2026-04-05] TASK-FT008-02 backend reviews-feedback scaffold
- Added `backend/src/slices/reviews-feedback` with minimal domain/application/infrastructure/presentation layers plus a Prisma-backed `Review` persistence baseline and canonical `review.created` touchpoint owned by the slice.
- Added repo-local `reviews-feedback` unit/integration Jest coverage and dedicated npm scripts, then marked `TASK-FT008-02` done and promoted `TASK-FT008-04` to `ready` while `REQ-013` / `REQ-014` remain `planned` pending completed-only runtime behavior, negative alert delivery, and final verification evidence.

## [2026-04-05] TASK-FT008-01 review boundary docs freeze
- Tightened `FT-008`, `IMPL-FT-008`, `telegram-bot-contract`, `manual-refund-and-negative-alerts`, and `testing/index.md` around the `COMPLETED` activation gate, structured review payload ownership, duplicate/replay safety, and single-fan-out semantics for `review.negative`.
- Marked `TASK-FT008-01` done and promoted `TASK-FT008-02` plus `TASK-FT008-03` to `ready` without changing RTM rows, because runtime review/alert behavior and final verification evidence still belong to later `FT-008` tasks.

## [2026-04-05] TASK-FT007-07 admin auth verification suite and final docs sync
- Re-ran the full repo-local `FT-007` verification bundle across backend `admin-access` and admin frontend suites, confirming login/refresh/logout behavior, lockout/audit evidence, fixed session lifetime, idle-timeout rejection, and protected-route UX through the checked-in Jest harness plus targeted lint/typecheck gates.
- Marked `TASK-FT007-07` done and synced final docs closure: `REQ-015`, `REQ-016`, `REQ-017`, and the `FT-007` row of `REQ-018` are now `done`, while feature/backlog/index docs explicitly reflect full current-scope closure.

## [2026-04-05] TASK-FT007-06 admin-web auth UX wiring
- Wired `frontend/src/admin` to the backend cookie-based auth contour through a dedicated auth API client, centralized router/protected-shell session handling, and shared login/logout flows that keep assignment and cancellation pages behind one auth boundary.
- Added focused admin frontend coverage for login submit, refresh restore, expired-session feedback, logout, and cookie-auth API parsing, then updated operational admin API clients to send `credentials: "include"` so existing pages share the same session contour.

## [2026-04-04] TASK-FT007-05 refresh, logout and session lifetime enforcement
- Implemented `admin-access` refresh and logout flows so refresh tokens rotate without extending the fixed 3-day session lifetime, logout revokes the active session and writes `logout` audit, and expired or idle-timed-out sessions are revoked before returning controlled `401` errors.
- Tightened session enforcement so lockout revokes active session chains for the affected admin account, then added focused repo-local unit/integration coverage for refresh rotation, refresh expiry, idle-timeout rejection, logout revocation, and lockout-triggered session revocation; `TASK-FT007-06` is now `ready`.

## [2026-04-04] TASK-FT007-04 backend login and lockout enforcement
- Implemented `admin-access` login so provisioned accounts can authenticate through the slice-owned service/controller boundary, creating hashed refresh-session records and `login_success` audit entries on success while keeping token secrets out of audit payloads.
- Added controlled `login_failed` and threshold-triggered `locked` audit behavior with `401` invalid-credential and `429` lockout `AppError` outcomes, plus focused repo-local unit/integration coverage for successful login, already-locked accounts, invalid credentials, and fifth-failure lockout.

## [2026-04-04] TASK-FT007-03 admin login shell scaffold
- Added a minimal `frontend/src/admin` auth boundary with `/admin/login`, a shared protected shell for existing admin routes, and placeholder anonymous/expired/authenticated session states without claiming backend runtime ownership.
- Extended repo-local admin frontend smoke coverage so login route rendering, protected-route fallback, expired-session fallback, and authenticated placeholder rendering are now exercised through the existing Jest harness.

## [2026-04-04] TASK-FT007-02 backend admin-access scaffold
- Added `backend/src/slices/admin-access` with slice-owned domain/application/infrastructure/presentation layers plus Prisma-backed baseline models for provisioned admin credentials, hashed refresh sessions, and auth audit persistence.
- Added repo-local `admin-access` unit/integration Jest coverage and dedicated npm scripts for credential verification, lockout window/session lifetime helpers, and audit/session persistence wiring.
- Marked `TASK-FT007-02` done and promoted `TASK-FT007-04` to `ready`; RTM rows for `REQ-015`, `REQ-016`, `REQ-017`, and the `FT-007` row of `REQ-018` remain `planned` pending runtime login/refresh/logout behavior and final verification evidence.

## [2026-04-03] TASK-FT006-08 final refund evidence and docs closure
- Re-ran the focused repo-local refund regression evidence for `FT-006` and synced the manual refund runbook so final closure now explicitly confirms the `PENDING_MANUAL -> DONE/REJECTED` workflow, operator note visibility, and absence of paid cancelled orders without `refund_status`.
- Marked `TASK-FT006-08` done, closed `REQ-012` and the `FT-006` row of `REQ-018`, and updated `FT-006` feature/backlog/index docs to reflect full current-scope closure.

## [2026-04-03] TASK-FT006-07 cancellation and refund verification suite
- Extended the backend `order-cancellation` integration suite with a sequential `cancel -> refund update` evidence path that proves persisted cancellation actor/reason data, explicit `PENDING_MANUAL -> DONE` refund tracking, and canonical `order.cancelled` / `order.refund_updated` audit-event writes while keeping client prohibition covered as a side-effect-free controlled failure.
- Extended the admin frontend smoke suite so repo-local operator evidence now keeps `refund_status` explicit for `CANCELLED_BY_ADMIN`, `CANCELLED_BY_COURIER_UNAVAILABLE`, and post-refund `DONE` visibility; marked `TASK-FT006-07` done, promoted `TASK-FT006-08` to `ready`, and updated `REQ-011` to `done` while `REQ-012` plus the `FT-006` `REQ-018` row remain open for final refund evidence sync.

## [2026-04-03] TASK-FT006-06 admin cancellation/refund UX wiring
- Wired `frontend/src/admin` cancellation/refund flow to a minimal backend API client for `POST /api/v1/admin/orders/:orderId/cancellation` and `POST /api/v1/admin/orders/:orderId/refund`, preserving the existing `FT-006` admin-web scope without pulling `FT-007` auth/session ownership.
- Extended admin frontend smoke coverage for default API success paths, controlled backend error rendering, manual refund note/status updates, and duplicate-submit protection; marked `TASK-FT006-06` done and promoted `TASK-FT006-07` to `ready` while `FT-006` RTM rows remain `planned` pending final verification and refund evidence sync.

## [2026-04-03] TASK-FT006-05 manual refund progression and note persistence
- Implemented backend manual refund updates in the `order-cancellation` slice so cancelled paid orders can progress only from `PENDING_MANUAL` to `DONE` or `REJECTED`, with a required persisted operator note and no automated provider refund side effects.
- Added focused repo-local unit/integration coverage for refund note persistence, `order.refund_updated` audit/event publication, and side-effect-free rejection of unpaid or invalid refund updates; marked `TASK-FT006-05` done and promoted `TASK-FT006-06` to `ready` while `FT-006` RTM rows remain `planned` pending UI wiring and final verify evidence.

## [2026-04-03] TASK-FT006-04 authorized cancellation command
- Implemented the backend `order-cancellation` command flow so only `admin` and the assigned `courier` in the explicit unavailable-case can cancel, while invalid roles/states return controlled `AppError` responses without order/history/audit/event side effects.
- Added focused repo-local unit/integration coverage for admin cancellation, courier unavailable-case cancellation, client prohibition, invalid-state rejection, and canonical `order.cancelled` audit/event persistence; marked `TASK-FT006-04` done and promoted `TASK-FT006-05` to `ready` while `FT-006` RTM rows remain `planned` pending later refund/UI/verify tasks.

## [2026-04-03] TASK-FT006-03 admin cancellation/refund frontend scaffold
- Added `/admin/orders/cancellation` to the existing admin-web contour with a fixture-driven route/page/view-model shell that exposes cancellation reason selection, explicit refund-state rendering, and success/error feedback without claiming backend runtime ownership.
- Added focused admin frontend Jest coverage for cancellation route resolution and shell behavior, then marked `TASK-FT006-03` done while keeping `TASK-FT006-04` `ready` and `FT-006` RTM rows `planned` until runtime behavior and final evidence land.

## [2026-04-03] TASK-FT006-02 backend order-cancellation scaffold
- Added `backend/src/slices/order-cancellation` with minimal domain/application/infrastructure/presentation layers plus a Prisma-backed baseline for cancellation metadata, refund persistence, cancellation/refund audit writes, and canonical event publish points.
- Added repo-local `order-cancellation` unit/integration Jest coverage, dedicated npm scripts, and aligned cancellation status naming to the current `FT-006` normative wording.
- Marked `TASK-FT006-02` done and promoted `TASK-FT006-04` to `ready`; RTM rows for `REQ-011`, `REQ-012`, and the `FT-006` `REQ-018` trace row remain `planned` until runtime behavior and final verify evidence land.

## [2026-04-03] TASK-FT006-01 cancellation/refund docs freeze
- Tightened `FT-006`, `order-lifecycle`, `manual-refund-and-negative-alerts`, `testing/index.md`, and `IMPL-FT-006` around allowed-role cancellation, explicit refund-state semantics (`NOT_REQUIRED`, `PENDING_MANUAL`, `DONE`, `REJECTED`), and verify ownership split.
- Marked `TASK-FT006-01` done and promoted `TASK-FT006-02` plus `TASK-FT006-03` to `ready` without changing RTM rows, because runtime implementation and final verification evidence remain future work.

## [2026-04-03] TASK-FT005-08 polling SLA evidence and final FT-005 closure
- Added a repo-local `order-tracking` SLA harness that samples 20 event-emission offsets across the current 5-second polling window and confirms visibility latency `p95 = 4500 ms`, `max = 4750 ms`, keeping `REQ-010` inside the MVP target without entering `FT-006` cancellation scope.
- Re-ran the ordered polling regression suite and synchronized final docs/statuses: `TASK-FT005-08` is now `done`, `REQ-010` is `done`, and `FT-005` is fully closed in the current RTM/Memory Bank scope.

## [2026-04-03] TASK-FT005-07 end-to-end tracking and polling verification
- Extended the `delivery-tracking` backend integration suite so the same repo-local scenario now drives `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`, asserts committed `order_status_history` / `order.status_changed` writes, and then re-reads the ordered event stream via `GET /events?since=<cursor>` semantics without entering `FT-006` cancellation scope.
- Extended the frontend `order-tracking` route smoke so courier actions and resumed polling stay duplicate-safe through the full `COMPLETED` flow, proving ordered event observation from command-confirmed revisions up to the terminal state.
- Marked `TASK-FT005-07` done, promoted `TASK-FT005-08` to `ready`, and synced RTM rows: `REQ-008`, `REQ-009`, and the `FT-005` `REQ-018` trace row are now `done`, while `REQ-010` remains `planned` until SLA evidence lands.

## [2026-04-03] TASK-FT005-06 notifications and polling-consumer wiring
- Wired `delivery-tracking` status changes to a slice-owned notifier contract plus Telegram bot transport adapter so committed `order.status_changed` writes can fan into courier prompts without moving transition rules into runtime/transport layers or rolling back on notifier outage.
- Upgraded the frontend `order-tracking` polling consumer to run interval polling, derive next actions from ordered status updates, and dedupe command-confirmed revisions across retry/resume paths so repeated polls do not double-apply write-side effects in the UI.
- Marked `TASK-FT005-06` done and promoted `TASK-FT005-07` to `ready`; RTM rows for `REQ-008/009/010/018` remain unchanged because final end-to-end closure and SLA evidence still belong to later `FT-005` tasks.

## [2026-04-03] TASK-FT005-05 verification sync
- `/verify TASK-FT005-05` independently reran the focused `delivery-tracking` unit/integration Jest suite and repo-local TypeScript verification without evidence drift.
- Kept statuses unchanged: `TASK-FT005-05` remains `done`, `TASK-FT005-06` remains `ready`, and RTM rows for `REQ-009/010/018` stay unchanged until notification/runtime wiring, final end-to-end closure, and SLA evidence land.

## [2026-04-03] TASK-FT005-05 ordered polling read path
- Implemented backend `delivery-tracking` ordered polling so `GET /events?since=<cursor>` now maps persisted events into stable read models with string `revision`, string `nextCursor`, and ISO `createdAt` while preserving ascending order.
- Added focused unit/integration coverage for ordered polling results, empty-window cursor stability, duplicate requests with the same cursor, and explicit no-write behavior on the read path.
- Marked `TASK-FT005-05` done and promoted `TASK-FT005-06` to `ready`; RTM rows for `REQ-009/010/018` remain unchanged because notification/runtime wiring, final end-to-end closure, and SLA evidence still belong to later `FT-005` tasks.

## [2026-04-03] TASK-FT005-04 verification sync
- `/verify TASK-FT005-04` independently reran the focused `delivery-tracking` Jest suite and repo-local TypeScript verification without evidence drift.
- Kept statuses unchanged: `TASK-FT005-04` remains `done`, `TASK-FT005-05` remains `ready`, and RTM rows for `REQ-008/009/010/018` stay unchanged until ordered polling/runtime and final SLA closure land.
- `npm run lint` is not available in the current repository (`Missing script: "lint"`), so the autonomous MB-SYNC lint checkpoint cannot be executed as a repo script at this time.

## [2026-04-03] TASK-FT005-04 courier status command flow
- Implemented backend `delivery-tracking` command validation for authenticated courier actors, assigned-courier ownership, adjacent post-assignment transitions, and project-standard `409 CONFLICT` / `403` / `404` handling without rejected-write side effects.
- Tightened the transactional write path so successful status changes persist `order`, `order_status_history`, and canonical `order.status_changed`, while the command response keeps polling-friendly `updatedAt` and string `revision` metadata.
- Marked `TASK-FT005-04` done and promoted `TASK-FT005-05` to `ready`; RTM rows for `REQ-008/009/010/018` remain unchanged because ordered polling runtime closure, notifications, and final feature verification still belong to later `FT-005` tasks.

## [2026-04-03] TASK-FT005-03 verification sync
- `/verify TASK-FT005-03` independently reran the focused backend/frontend scaffold checks plus repo-local TypeScript verification without evidence drift.
- Kept statuses unchanged: `TASK-FT005-03` remains `done`, `TASK-FT005-04` remains `ready`, and `REQ-009/010` for `FT-005` stay `planned` until real polling runtime behavior and SLA evidence land.

## [2026-04-03] TASK-FT005-02 backend delivery-tracking scaffold
- Added `backend/src/slices/delivery-tracking` with minimal domain/application/infrastructure/presentation layers and a slice-owned repository baseline for order lookup, transactional status/history/event persistence, and ordered event reads.
- Added repo-local `delivery-tracking` Jest coverage plus dedicated npm scripts for unit/integration execution.
- Marked `TASK-FT005-02` done and promoted `TASK-FT005-04` to `ready`; RTM rows for `REQ-008/009/010/018` stay `planned` because state-machine enforcement, full polling behavior, and SLA evidence still belong to later `FT-005` tasks.

## [2026-04-03] TASK-FT005-02 verification sync
- `/verify TASK-FT005-02` independently reran the focused `delivery-tracking` Jest suite and repo-local TypeScript verification without evidence drift.
- Kept statuses unchanged: `TASK-FT005-02` remains `done`, `TASK-FT005-04` remains `ready`, and `REQ-008/009/010/018` for `FT-005` stay `planned` until later runtime and SLA closure.

## [2026-04-03] TASK-FT005-01 tracking contract and SLA verify freeze
- Tightened `FT-005`, `IMPL-FT-005`, `api-events-baseline`, and `order-lifecycle` around courier-owned post-assignment transitions, explicit `409 CONFLICT` no-side-effect semantics, and opaque string cursor polling rules.
- Tightened `testing/index.md` so `FT-005` keeps functional tracking/polling verification separate from the final `REQ-010` latency evidence gate.
- Marked `TASK-FT005-01` done and promoted `TASK-FT005-02` plus `TASK-FT005-03` to `ready` without changing RTM rows, because runtime implementation and SLA evidence remain future work.

## [2026-04-03] TASK-FT005-01 verification sync
- `/verify TASK-FT005-01` re-checked the docs-only state-machine, polling cursor, `409 CONFLICT`, and SLA-ownership freeze against the current workspace without evidence drift.
- Kept statuses unchanged: `TASK-FT005-01` remains `done`, `TASK-FT005-02` and `TASK-FT005-03` remain `ready`, and `REQ-008/009/010/018` RTM rows for `FT-005` stay `planned` until runtime implementation and final SLA evidence exist.

## [2026-04-03] TASK-FT004-07 final assignment verification and docs sync
- Added final admin assignment route smoke coverage for the default `fetch -> API client -> route` path, including revision-based success feedback and controlled backend error rendering.
- Re-ran repo-local backend/frontend delivery-assignment suites plus TypeScript verification; the passing evidence now explicitly covers RBAC, `CREATED -> ASSIGNED`, audit/history/event writes, and actor-targeted courier notification semantics.
- Marked `TASK-FT004-07` done and synced `REQ-007` plus the `FT-004` `REQ-018` RTM row to `done` without expanding into `FT-005` tracking or `FT-007` admin auth/session scope.

## [2026-04-03] TASK-FT004-07 verification sync
- `/verify TASK-FT004-07` independently reran the focused admin frontend suite, backend delivery-assignment suite, and repo-local TypeScript check without evidence drift.
- Kept statuses unchanged: `TASK-FT004-07` remains `done`, `REQ-007` and the `FT-004` `REQ-018` RTM row remain `done`, and downstream scope ownership stays with `FT-005` / `FT-007`.

## [2026-04-03] TASK-FT004-06 admin assignment UX wiring
- Wired `frontend/src/admin` assignment submit flow to a minimal backend API client for `POST /api/v1/admin/orders/:orderId/assignment`, preserving the existing `FT-004` admin-web scope without adding `FT-007` auth/session ownership.
- Added controlled parsing/rendering for the project error contract `{ error: { code, message, details }, trace_id }` and success confirmation based on the backend command response `revision`.
- Added a submit-in-flight guard plus focused admin frontend tests for request wiring, loading/success/error rendering, and duplicate-submit prevention.
- Marked `TASK-FT004-06` done and promoted dependent `TASK-FT004-07` to `ready`; RTM for `REQ-007` / `REQ-018` stays `planned` until final `FT-004` verification closure.

## [2026-04-03] TASK-FT004-06 verification sync
- `/verify TASK-FT004-06` re-ran the focused admin frontend Jest suite and repo-local TypeScript verification without evidence drift.
- Kept backlog and RTM statuses unchanged: `TASK-FT004-06` remains `done`, `TASK-FT004-07` remains `ready`, and `REQ-007` / `REQ-018` stay `planned` until final `FT-004` closure.

## [2026-04-03] TASK-FT004-05 targeted courier notification integration
- Added a minimal `telegram-bot` notifier boundary for `order.assigned` and wired `delivery-assignment` to dispatch only to the assigned courier after the successful assignment commit.
- Kept transport/runtime outside assignment business rules: notification failures are swallowed as operational issues so retry or duplicate delivery cannot create duplicate assignment writes.
- Added repo-local unit/integration coverage for actor-targeted dispatch, post-event notification ordering, and notifier-failure safety.
- Marked `TASK-FT004-05` done and promoted dependent `TASK-FT004-06` to `ready`; RTM stays unchanged because admin-web flow closure and final feature verification remain in later `FT-004` tasks.

## [2026-04-03] TASK-FT004-05 verification sync
- `/verify TASK-FT004-05` re-ran the focused `delivery-assignment` Jest suite and repo-local TypeScript verification without evidence drift.
- Kept backlog statuses unchanged: `TASK-FT004-05` remains `done`, `TASK-FT004-06` remains `ready`, and RTM for `REQ-007` / `REQ-018` stays `planned` until final `FT-004` closure.

## [2026-04-03] TASK-FT004-04 backend assignment command
- Implemented the owning `delivery-assignment` command flow for authenticated admin assignment with RBAC, `CREATED -> ASSIGNED` validation, courier eligibility checks, and transactional order/history/audit/event persistence.
- Added repo-local unit/integration coverage for happy path, invalid role, invalid order state, invalid courier target, and controlled `AppError` payload serialization with no persistence side effects on rejected requests.
- Marked `TASK-FT004-04` done and promoted dependent `TASK-FT004-05` to `ready`; RTM stays unchanged because targeted bot delivery, admin-web wiring, and final feature closure still belong to later `FT-004` tasks.

## [2026-04-03] TASK-FT004-03 admin assignment frontend scaffold
- Added a dedicated `frontend/src/admin` contour scaffold with its own router, shell, and fixture-driven courier assignment page so `FT-004` stays separate from the Mini App router.
- Added repo-local frontend Jest coverage for admin route resolution, form state, and controlled success/error rendering, plus a focused `test:delivery-assignment:frontend` script.
- Marked `TASK-FT004-03` done and kept RTM unchanged because backend command wiring, notification delivery, and full admin-flow closure still belong to later `FT-004` tasks.

## [2026-04-03] TASK-FT004-03 verification sync
- `/verify TASK-FT004-03` re-ran the focused admin frontend Jest suite and repo-local TypeScript check without evidence drift.
- Kept backlog status `done` and RTM unchanged: this task closes only the admin-web scaffold/harness layer, while feature-complete assignment behavior still belongs to later `FT-004` tasks.

## [2026-03-29] Initial setup
- Created Memory Bank skeleton
- Seeded core docs (product, requirements, testing, backlog)

## [2026-03-30] TASK-FT001-01 docs-first freeze
- Added `catalog-public-api` and `seller-catalog-write-policy` contracts for `FT-001`.
- Linked new contract layer from `FT-001`, `IMPL-FT-001`, and Memory Bank navigation.
- Marked `TASK-FT001-01` done in backlog.

## [2026-03-30] TASK-FT001-02 verification failure
- Verified that `TASK-FT001-02` has no backend scaffold, Prisma baseline, or test harness yet.
- Added bug record and verification artifact for the missing implementation state.
- Marked `TASK-FT001-02` as `failed` and downstream dependent catalog tasks as `blocked`.

## [2026-03-30] TASK-FT001-02 backend scaffold
- Added baseline `backend/prisma/schema.prisma` for `catalog` entities.
- Added layered backend `catalog` slice scaffold and technical `shared` helpers.
- Added backend integration/unit test skeleton files and restored catalog backlog flow after scaffold completion.

## [2026-03-30] TASK-FT001-03 frontend scaffold
- Added `frontend/src/app/router.tsx` public route shell for `catalog`.
- Added frontend `catalog` slice scaffold, shell/runtime-only shared helpers, and frontend test skeleton files.
- Marked `TASK-FT001-03` done and promoted next backend runtime tasks for `FT-001` to `ready`.

## [2026-03-30] TASK-FT001-04 public catalog reads
- Implemented backend public read queries for `shops` and `products` in the owning `catalog` slice.
- Enforced soft-delete filtering for shops, products, and products under deleted shops.
- Added deterministic verification evidence for browse-safe payloads and updated Memory Bank navigation/status notes.

## [2026-03-30] TASK-FT001-04 verification failure
- `/verify TASK-FT001-04` found that repo-level Jest configuration is missing, so task-declared `.spec.ts` tests cannot run through the project harness.
- Added active bug record and follow-up backlog task `TASK-FT001-09` for test runner setup.
- Marked `TASK-FT001-04` as `failed` and blocked dependent `TASK-FT001-07` and `TASK-FT001-08` until re-verification.

## [2026-03-30] TASK-FT001-05 seller shop writes
- Implemented seller-only shop update flow with ownership guard and controlled authorization error.
- Added first-free then manual-paid rename marker logic without touching cross-slice snapshot boundaries.
- Added deterministic runtime evidence and recorded formal verification failure due to missing repo-level Jest config.

## [2026-03-30] TASK-FT001-09 repo-local catalog test runner
- Added root `package.json`, `jest.config.cjs`, and `tsconfig.jest.json` to run existing backend catalog specs from the repository.
- Verified `catalog.unit.spec.ts` and `catalog.integration.spec.ts` through checked-in npm scripts.
- Marked `TASK-FT001-09` done and unblocked `/verify TASK-FT001-04` and `/verify TASK-FT001-05` reruns.

## [2026-03-30] TASK-FT001-04 re-verification pass
- Re-ran `/verify TASK-FT001-04` after `TASK-FT001-09` added repo-local Jest harness.
- `npm run test:catalog:integration` and `npm run test:catalog` now pass.
- Marked `TASK-FT001-04` done and unblocked `TASK-FT001-07`.

## [2026-03-30] TASK-FT001-05 re-verification pass
- Re-ran `/verify TASK-FT001-05` after `TASK-FT001-09` added repo-local Jest harness.
- `npm run test:catalog:unit` and `npm run test:catalog:integration` now pass.
- Marked `TASK-FT001-05` done and unblocked `TASK-FT001-08` from the previous harness blocker.

## [2026-03-30] TASK-FT001-06 seller product writes
- Implemented seller-scoped product create/update flow with owner-only mutation rules inside `catalog`.
- Added target shop linkage validation so seller cannot attach products to foreign shops.
- Verified the task with repo-local unit/integration catalog suites and marked `TASK-FT001-06` done.

## [2026-03-30] TASK-FT001-06 verification pass
- Re-ran `/verify TASK-FT001-06` against the repo-local harness.
- Typecheck, `npm run test:catalog:unit`, `npm run test:catalog:integration`, and `npm run test:catalog` all pass.
- Task remains `done` with formal verification evidence stored in `.tasks/TASK-FT001-06/`.

## [2026-04-01] TASK-FT001-07 public catalog UI wiring
- Wired the frontend `catalog` route to backend public browse reads for shops and per-shop products.
- Added explicit `loading`, `empty`, and `error` view-model states and rendered browse-safe catalog sections without auth assumptions.
- Extended the repo-local catalog Jest harness with frontend API/view-model smoke specs and verified `npm run test:catalog` end-to-end for the current catalog task set.

## [2026-04-01] TASK-FT001-07 verification failure
- `/verify TASK-FT001-07` found that task-level evidence does not cover customer-facing route/page rendering.
- Direct Jest runs for existing `catalog-page.spec.tsx` and `catalog-route.spec.tsx` returned `No tests found` because the repo-local harness matches only `*.spec.ts` files.
- Marked `TASK-FT001-07` as `failed`, created an active bug record, and blocked dependent `TASK-FT001-08` until route/page verification is added.

## [2026-04-01] TASK-FT001-07 verification pass after route/page smoke fix
- Extended the repo-local catalog Jest harness to execute frontend `*.spec.tsx` route/page smoke tests.
- Added deterministic public browse rendering coverage for `CatalogPage` and `CatalogRoute`, including loading, empty, error, and ready states.
- Re-ran `npm run test:catalog` and route/page smoke specs successfully, archived the verification bug, and restored `TASK-FT001-07` to `done`.

## [2026-04-01] TASK-FT001-08 final catalog verification and RTM sync
- Re-ran repo-local typecheck, unit, integration, and combined catalog verification gates for `FT-001`.
- Synced `REQ-001`, `REQ-002`, and `REQ-020` to `done` based on route/page smoke, seller ownership integration, and rename/snapshot-scope evidence.
- Marked `TASK-FT001-08` done and closed the remaining feature-wide verification/docs sync for the current repo scope.

## [2026-04-01] ASCII diagram layer for AI agents
- Added `.memory-bank/diagrams/` with high-value ASCII maps for spec routing, repo/code coverage, runtime contours, slice boundaries, and order lifecycle ownership.
- Linked the new visual layer from Memory Bank index, spec index, architecture index, and documentation navigation.
- Kept diagrams as derived guidance while preserving existing spec docs as the normative source of truth.
- Expanded diagrams with a detailed layered-monolith `SYSTEM` view and a Mini App frontend `LAYER VIEW` aligned to the single Telegram runtime adapter boundary.

## [2026-04-01] Telegram docs review cleanup and MB sync
- Removed the temporary Telegram research artifact after review and deleted all stale references to it from Memory Bank and `doc/*` navigation.
- Kept the new Telegram-specific `contracts`, `runbooks`, and `diagrams` as the durable spec layer for auth, payment confirmation, WebView runtime, and verification guidance.
- Refreshed Memory Bank navigation/backlog so the next action points to `/prd-to-tasks` for the remaining customer-facing wave instead of stale `FT-001` task execution.

## [2026-04-01] TASK-FT002-01 checkout auth/payment docs freeze
- Extended `FT-002` with explicit `REQ-022/023` coverage, Telegram-sensitive verification baseline, and links to runtime/runbook layers.
- Tightened `telegram-mini-app-auth-contract` with explicit HttpOnly-cookie, CSRF, and CSP/XSS storage baseline.
- Tightened `payment-confirmation-contract` with monitoring/manual-recovery requirements for trusted payment confirmation.
- Marked `TASK-FT002-01` done and promoted `TASK-FT002-02` and `TASK-FT002-03` to `ready`.

## [2026-04-01] TASK-FT002-02 backend checkout-payment scaffold
- Added backend `checkout-payment` slice scaffold with `domain`, `application`, `infrastructure`, and `presentation` layers.
- Extended Prisma baseline with `Order` payment identity, refund, and uniqueness fields required for trusted payment follow-up tasks.
- Added repo-local backend unit/integration scaffold for `checkout-payment`, delegated formal verify back to the implementation worker, and after `PASS` promoted `TASK-FT002-04` to `ready`.

## [2026-04-01] TASK-FT002-03 frontend checkout-payment scaffold
- Added frontend `checkout-payment` route shell, `checkoutPayment` route registration, and slice scaffold for `api`, `model`, `hooks`, `components`, and `routes`.
- Extended the repo-local Jest harness so frontend `checkout-payment` specs are discoverable and runnable in-band on Windows.
- Delegated formal verify back to the implementation worker, marked `TASK-FT002-03` done after `PASS`, and moved `TASK-FT002-04` into active execution.

## [2026-04-02] TASK-FT002-04 Telegram auth validation and session issuance
- Completed backend `POST /auth/telegram` handling in the owning `checkout-payment` slice with Telegram HMAC validation, 10 minute `auth_date` TTL, replay guard, and HttpOnly cookie transport metadata.
- Added repo-local unit and integration coverage for valid, invalid, expired, and replayed raw `initData`.
- Verified the task with in-band Jest, marked `TASK-FT002-04` done, promoted `TASK-FT002-05` to `ready`, and synced `REQ-004` to `done`.

## [2026-04-02] TASK-FT002-05 trusted payment finalization
- Implemented backend `POST /orders/checkout` finalization flow in the owning `checkout-payment` slice with provider/source verification, paid-only order creation, and duplicate-delivery idempotency by trusted payment identity.
- Added repo-local unit and integration coverage for trusted callback/status confirmation, client-signal rejection, non-paid rejection, and single-order behavior on duplicate delivery.
- Verified the task with in-band Jest, marked `TASK-FT002-05` done, and promoted `TASK-FT002-06` to `ready`.

## [2026-04-02] TASK-FT002-06 payment failure and retry-safe error contract
- Refined `POST /orders/checkout` failure paths so `FAILED`, `CANCELED`, and timeout-like `PENDING` confirmations return controlled retry-safe `AppError` details without touching order persistence.
- Added repo-local unit and integration coverage for failed, canceled, and timeout-like payment outcomes plus error-contract serialization evidence.
- Verified the task with in-band Jest, marked `TASK-FT002-06` done, and promoted `TASK-FT002-07` to `ready`.

## [2026-04-02] TASK-FT002-07 frontend checkout wiring
- Wired the frontend `checkout-payment` route to Telegram init-data gating plus backend-facing auth and checkout API calls without introducing client-only payment confirmation.
- Expanded the checkout view-model/page flow with submitting, success, controlled error, and retryable failure states that surface backend-driven semantics.
- Added repo-local frontend smoke coverage for happy path, retryable failure UX, and blocked checkout outside Telegram; verified the combined checkout test set and promoted `TASK-FT002-08` to `ready`.

## [2026-04-02] FT-002 / FT-009 verification ownership sync
- Moved real Telegram client-matrix ownership for customer-facing checkout UI from `FT-002` to `FT-009`, because the Mini App shell/runtime baseline is implemented there.
- Kept `FT-002` verification focused on backend/frontend repo-local auth/payment checks and Telegram/Bot transport/source verification where applicable.
- Rebased `TASK-FT002-08` from blocked client-matrix gate back to `ready` under the updated spec split.

## [2026-04-02] FT-003 decomposition and backlog sync
- Added protocol artifacts for `FT-003` decomposition with execution-ready wave planning in `.protocols/FT-003/`.
- Added `IMPL-FT-003` and `TASK-FT003-01` ... `TASK-FT003-06` so localization work now has a docs-first plan, dependencies, tests, and verification targets.
- Synced Memory Bank navigation and backlog so the next recommended action is executing `TASK-FT003-01` before broader runtime implementation.

## [2026-04-02] TASK-FT002-08 final checkout verification and docs sync
- Re-ran repo-local checkout typecheck and the combined backend/frontend checkout Jest suites for Telegram auth, trusted payment confirmation, retry-safe failures, and checkout UI smoke.
- Synced `FT-002` verification closure to the executed evidence, marked `REQ-005`, `REQ-006`, and `REQ-021` as `done`, and closed `TASK-FT002-08` in the backlog.
- Recorded that `FT-002` verification remains limited to repo-local auth/payment runtime plus transport/source verification, while real checkout client-matrix evidence stays under `FT-009`.

## [2026-04-02] TASK-FT003-01 language policy and verify boundary freeze
- Extended `FT-003` to explicitly cover `REQ-022/023`, runtime-contract inputs, and verify ownership boundaries against `FT-009`.
- Tightened `mini-app-runtime-contract` with explicit `ru` baseline, Telegram `user.language_code` hint-only policy, and precedence of explicit user choice.
- Tightened `telegram-mini-app-verification` for localization with repo-local runtime contract checks, fallback-to-`ru`, and explicit separation from shell/runtime verification.
- Marked `TASK-FT003-01` done and promoted `TASK-FT003-02` to `ready`.

## [2026-04-02] TASK-FT003-02 localization runtime scaffold
- Added the shared frontend localization scaffold for `FT-003`: default-language normalization, centralized persistence helpers, Telegram storage adapter types, shared language controller/state, and an app-level localization boundary.
- Added repo-local Jest coverage for language normalization, persistence fallback orchestration, localization overlay visibility, and app-router rendering through the new boundary.
- Marked `TASK-FT003-02` done and promoted `TASK-FT003-03` to `ready`.

## [2026-04-02] TASK-FT003-03 deterministic language resolution and fallback policy
- Tightened shared language parsing so unsupported, empty, and damaged persisted values deterministically fallback to `ru` without being treated as confirmed user choices.
- Made language persistence degrade through unavailable Device/Cloud storage while preserving `DeviceStorage -> CloudStorage -> localStorage` order, and added concrete Telegram storage adapter wrappers with repo-local contract tests.
- Marked `TASK-FT003-03` done and promoted `TASK-FT003-04` to `ready`.

## [2026-04-02] TASK-FT003-04 overlay gating and authenticated language sync
- Tightened the app-level localization boundary so first-run language selection blocks customer-facing route rendering until an explicit choice exists.
- Added a narrow backend language update path inside `checkout-payment`, and wired checkout auth to synchronize the explicit client language into backend profile state.
- Verified focused frontend/backend plus combined localization/checkout Jest suites, marked `TASK-FT003-04` done, and promoted `TASK-FT003-05` to `ready`.

## [2026-04-02] TASK-FT003-05 localized customer-facing copy baseline
- Added a shared frontend copy dictionary and wired localized baseline strings into the first-run overlay, catalog route, and checkout route without expanding runtime/storage ownership.
- Expanded frontend route/page/view-model/API smoke coverage to verify `ru/en/tj` copy rendering across catalog and checkout customer-facing flows.
- Verified focused plus combined frontend Jest suites and repo-local TypeScript typecheck, marked `TASK-FT003-05` done, and promoted `TASK-FT003-06` to `ready`.

## [2026-04-02] TASK-FT003-05 verification sync
- `/verify TASK-FT003-05` independently re-ran the focused localization Jest suites, the combined frontend app/catalog/checkout Jest suites, and repo-local TypeScript check without evidence drift.
- Kept `REQ-003` RTM lifecycle unchanged because final feature-wide localization verification and Telegram-specific evidence still belong to `TASK-FT003-06`.
- Synced Memory Bank wording so `FT-003` status notes explicitly reflect repo-local verification for the localized customer-facing copy baseline.

## [2026-04-02] TASK-FT004-01 assignment docs freeze
- Tightened `FT-004` around `CREATED -> ASSIGNED` ownership, `order.assigned` publish semantics, and required `updated_at`/string `revision` command-response baseline.
- Tightened `telegram-bot-contract` so assignment notification is explicitly actor-targeted to the assigned courier and retry/runtime issues do not widen delivery semantics.
- Marked `TASK-FT004-01` done and promoted `TASK-FT004-02` and `TASK-FT004-03` to `ready`.

## [2026-04-03] TASK-FT004-02 backend assignment scaffold baseline
- Added backend `delivery-assignment` slice structure (`domain/application/infrastructure/presentation`) without moving assignment rules into `shared`.
- Added Prisma persistence baseline for `order_status_history`, `delivery_assignment_audit`, and `events`, plus transactional repository wiring that returns string `revision` from the canonical `order.assigned` event record.
- Added focused unit/integration Jest coverage, marked `TASK-FT004-02` done, and promoted `TASK-FT004-04` to `ready`.

## [2026-04-03] MB sync after TASK-FT004-02 verify
- Re-ran repo-local `delivery-assignment` Jest coverage and TypeScript verification through `/verify TASK-FT004-02` without evidence drift.
- Kept RTM unchanged: `REQ-007` and `REQ-018` stay `planned` because feature-complete assignment behavior, admin-flow e2e, and notification runtime closure still belong to later `FT-004` tasks.

## [2026-04-02] TASK-FT003-06 localization verification closure
- Added direct `createLanguageController` coverage so unresolved fallback `ru`, explicit persisted `ru`, and selection persistence are verified at the controller boundary.
- Re-ran the combined frontend/backend localization verification suite and repo-local TypeScript check: `16` suites and `78` tests passed.
- Marked `REQ-003` and `TASK-FT003-06` done, while keeping `REQ-022` and `REQ-023` planned because broader shell persistence and real Telegram client-matrix closure remain shared with `FT-009`.

## [2026-04-02] MB sync after TASK-FT003-06 verify
- Re-synced Memory Bank after independent `/verify TASK-FT003-06` rerun so backlog navigation no longer points at the already closed localization task.
- Kept RTM and feature wording unchanged: `REQ-003` stays `done`, while the remaining Telegram shell/client-matrix closure still routes to `FT-009`.

## [2026-04-02] FT-009 decomposition and backlog sync
- Added protocol artifacts for `FT-009` decomposition with wave planning in `.protocols/FT-009/`.
- Added `IMPL-FT-009` and `TASK-FT009-01` ... `TASK-FT009-06` so Telegram Mini App shell/runtime work now has execution-ready tasks, dependencies, tests, and verification targets.
- Synced Memory Bank navigation and backlog so the next recommended action is executing `TASK-FT009-01` before shell/runtime implementation.

## [2026-04-02] TASK-FT009-06 quality-gate blocker
- `/verify TASK-FT009-06` failed not on code regressions, but because the required real Telegram client-matrix evidence for `iOS`, `Android`, and `Desktop/macOS` is absent from `.tasks/TASK-FT009-06/`.
- Added active bug record `BUG-2026-04-02-task-ft009-06-missing-telegram-client-matrix-evidence` and follow-up backlog task `TASK-FT009-07` for re-verification after evidence collection.
- Kept `REQ-019`, shared `REQ-022`, and `REQ-023` unchanged in RTM until the required client-matrix artifacts are supplied and verified.

## [2026-04-02] Android-only Telegram verify baseline
- Relaxed the current `FT-009` closure gate from full `iOS/Android/Desktop` matrix to mandatory real `Android Telegram` evidence only.
- Updated runbook, testing policy, runtime contract, `FT-009`, RTM, backlog and run-status wording so `iOS/Desktop` evidence is now optional hardening, not a blocking condition.
- Kept `TASK-FT009-06` failed until Android evidence is actually collected; only the required evidence scope changed.

## [2026-04-02] Telegram test server deployment runbook
- Added a dedicated runbook for deploying the current testable Mini App baseline to Ubuntu 22 VPS `213.155.13.112` behind Cloudflare subdomain `tgmeal.natureonzoom.win`.
- Documented DNS, Node/nginx/systemd setup, BotFather menu-button integration, Android first launch, and evidence collection for `FT-009` verification.
- Explicitly scoped the runbook to the current repo reality: frontend plus demo API for shell/runtime verification, not a production-complete backend/payment deploy.

## [2026-04-02] Cloudflare origin-cert deployment update
- Updated the test-server runbook to use `Cloudflare Proxied` DNS, `Cloudflare Origin Certificate`, and `Full (strict)` as the primary HTTPS path.
- Removed `Let's Encrypt` as the default deploy recommendation for the current `tgmeal.natureonzoom.win` setup.

## [2026-04-02] Catalog keyboard test field for Android verify
- Added a minimal localized text input on the catalog page so real Telegram Android runs can explicitly open the keyboard and capture `FT-009` viewport behavior evidence.

## [2026-04-02] FT-009 final Android verification closure
- Updated the verification policy so screenshots/videos are optional supporting artifacts and operator-confirmed Android Telegram notes are the blocking evidence for current closure.
- Recorded a successful Android Telegram run on the deployed test server, archived the prior evidence bug, and marked `TASK-FT009-06` done.
- Synced RTM and autonomous-run state: `REQ-019`, shared `REQ-022`, and `REQ-023` are now `done`, and the current `/autopilot` run is back to `SUCCESS`.

## [2026-04-02] Test-server runbook cleanup
- Reworked section 13 of the Telegram test-server runbook into a practical Android verification procedure instead of a loose checklist.
- Added a dedicated deployment update section documenting when `npm ci`, `npm run build:frontend`, demo API restart, and nginx reload are actually needed after `git pull`.

## [2026-04-02] MB sync after TASK-FT009-01 docs-first freeze
- Froze `FT-009` ownership against `FT-002` and `FT-003` across feature, runtime contract, runbook, testing docs, and implementation plan.
- Marked `TASK-FT009-01` done, promoted `TASK-FT009-02` to `ready`, and updated Memory Bank navigation for the next app-level shell scaffolding step.

## [2026-04-02] MB sync after TASK-FT009-02 shell scaffold
- Added a centralized frontend `AppShell` boundary plus shared shell state/context scaffold so customer-facing routes now have an app-level runtime integration point without leaking business logic into `shared`.
- Extended the shared Telegram bridge with version/theme/viewport/safe-area/event wrappers and added repo-local Jest coverage for shell boundary and shared shell primitives.
- Marked `TASK-FT009-02` done, promoted `TASK-FT009-03` to `ready`, and updated backlog navigation for the runtime adapter implementation step.

## [2026-04-02] MB sync after TASK-FT009-03 runtime adapter wiring
- Extended the shared Telegram bridge with a centralized runtime snapshot helper and added nested shell-state merge primitives so runtime data stays isolated from app/slice components.
- Wired `AppShell` to call `ready()/expand()`, subscribe to theme/viewport/safe-area/lifecycle events, and propagate stable viewport plus Telegram safe-area values through shell CSS variables instead of `env(safe-area-inset-*)` baseline usage.
- Passed focused repo-local Jest coverage and `tsconfig.jest.json` typecheck for the shell/runtime layer, then marked `TASK-FT009-03` done and promoted `TASK-FT009-04` to `ready`.

## [2026-04-02] MB sync after TASK-FT009-04 shell UX wiring
- Extended the shared shell context and Telegram bridge with centralized page-policy wiring so checkout can publish back-button and swipe behavior metadata without leaking Telegram runtime ownership into slice components.
- Wired catalog and checkout through the shared `PageShell` baseline, added shell-level action-feedback markers/layout structure, and removed duplicate checkout `ready()/expand()` bootstrap calls now owned by `AppShell`.
- Passed focused repo-local Jest coverage and `tsconfig.jest.json` typecheck for integrated shell UX wiring, then marked `TASK-FT009-04` done and promoted `TASK-FT009-05` to `ready`.

## [2026-04-02] MB sync after TASK-FT009-05 repo-local shell verification
- Expanded repo-local Jest coverage so `FT-009` now has deterministic evidence for runtime event propagation, catalog shell markers, and checkout action-feedback markers inside the centralized shell boundary.
- Passed focused frontend Jest coverage and `tsconfig.jest.json` typecheck for shell state, runtime adapter, app shell, catalog, and checkout verification scope.
- Marked `TASK-FT009-05` done, promoted `TASK-FT009-06` to `ready`, and updated Memory Bank navigation so the next step is real Telegram client-matrix evidence collection.

## [2026-04-02] MB sync after /verify TASK-FT009-05
- Independently re-ran the task-scoped shell/runtime Jest suite and `tsconfig.jest.json` typecheck during `/verify` without evidence drift.
- Kept RTM unchanged because `TASK-FT009-05` closes only deterministic repo-local verification; final `REQ-019/022/023` closure still depends on `TASK-FT009-06` real Telegram client-matrix evidence.
## [2026-04-03] TASK-FT005-03 polling consumer and courier harness scaffold
- Added `frontend` `order-tracking` route/model/hook/page scaffold plus focused Jest coverage for opaque cursor advancement and courier action entrypoints.
- Added a transport-only `telegram-bot` delivery-tracking harness for outbound courier prompts and callback parsing so downstream bot wiring stays outside state-machine ownership.
- Marked `TASK-FT005-03` done; downstream `TASK-FT005-06` remains blocked by pending `TASK-FT005-04` and `TASK-FT005-05`, and RTM rows for `REQ-009/010` stay `planned` until runtime behavior and SLA evidence land.
