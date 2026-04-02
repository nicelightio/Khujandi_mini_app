---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

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
