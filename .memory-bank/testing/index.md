---
description: Стратегия тестирования и верификации (quality gates, anti-cheat, UI/e2e).
status: active
---
# Testing & Verification

## Quality gates
- lint / typecheck
- unit tests
- integration tests (if applicable)
- e2e tests for critical user flows
- verify polling SLA evidence for `delivery-tracking`

## UI verification
- Prefer Playwright / agent-browser / CDP for UI flows when available
- Store operator notes in `.tasks/TASK-XXX/`; screenshots/videos/traces are optional supporting artifacts when they add value
- In Memory Bank keep only links + short conclusions
- Browser-only Playwright не считается достаточным evidence для Telegram-sensitive flows; для них нужен отдельный Telegram runtime verification layer.
- Для customer-facing Mini App motion/effect-heavy changes и новых тяжелых UI/runtime layers browser-only desktop smoke недостаточен: verify должен явно учитывать поведение в Telegram WebView и, где применимо, weak Android baseline.

## Slice-based baseline

- `catalog`: public browse e2e + seller ownership integration coverage + shared storefront seller edit mode and `WORKING/NOT_WORKING` visibility checks for seller contours + transactional/durable runtime verification for DB-backed provisioning and restart-safe storefront resolution (`FT-011`) + customer product selection/cart composition coverage for `FT-012`; the checked-in repo-local bootstrap baseline now starts from `backend/prisma/seeds/catalog-runtime-baseline.json` plus a SQLite-backed runtime state store rather than hidden demo arrays, provisioning conflict coverage includes hostile repeated/concurrent identity collisions at the persistence boundary plus restart-aware duplicate/conflict regressions on the same persisted DB path, mounted/runtime verification must also prove that one seller/Telegram identity can own multiple admin-provisioned shops when shop names differ, and admin-side provisioning coverage now also verifies the narrow read model that reloads existing shops from persisted catalog state while keeping `NOT_WORKING` rows visible only on the admin-owned list. Final `FT-011` closure is anchored by the manual restart-smoke notes in `.tasks/TASK-FT011-06/TASK-FT011-06-S-VERIFY-final-report-docs-01.md`. `FT-012` closure is anchored by `TASK-FT012-06` focused frontend/contract evidence for visible single-shop composition, deterministic duplicate handling, replace/clear behavior, blocked invalid/unavailable checkout handoff, and no order/payment/stock/event side effects.
- `checkout-payment`: paid order creation happy path, failed/canceled/timeout/ambiguous payment retry, auth validation, and `FT-013` customer checkout handoff coverage proving valid composition-required route entry, server-side catalog revalidation before payment/order creation, mounted Mini App auth/payment runtime, paid-only `CREATED` order persistence with customer-safe identity/revision metadata, controlled stale-composition repair UX, and duplicate-submit/provider-callback idempotency. `TASK-FT013-07` repo-local final gates pass, but formal `REQ-023`/`REQ-032` closure is blocked until fresh real `Android Telegram` checkout evidence is recorded.
- `mini app shell`: first-run language overlay, WebView-safe viewport, theme, lifecycle, action feedback, cheap-first motion/fixed-bottom UX smoke, and focused capability/degradation-policy coverage proving the base customer-facing shell stays usable when optional shell enhancements are reduced, while degraded Telegram runtime still preserves the shell-owned `keyboard-safe` bottom CTA path for critical actions.
- `delivery-assignment`: admin assignment e2e + RBAC integration.
- `delivery-tracking`: status-machine integration, polling e2e, и отдельный polling-SLA verify artifact; functional closure принадлежит runtime tasks `FT-005`, а финальный latency gate для `REQ-010` закрывается только explicit SLA evidence. Customer-facing `TASK-FT014-07` now provides checked-in mounted `/api/v1/events` evidence for the Mini App status path, customer/order scoping negative checks, checkout/status cursor compatibility, and opaque cursor tolerance; `REQ-033` still stays `planned` until final `TASK-FT014-06` plus upstream Android checkout evidence.
- `order-cancellation`: allowed-role cancellation e2e + refund state/audit integration; final closure also requires explicit evidence that paid cancelled orders never remain without visible `refund_status`.
- `reviews-feedback`: two-sided bot review e2e + negative alert integration; docs-first boundary freeze belongs to `TASK-FT008-01`, while final functional closure belongs to `TASK-FT008-07`.
- `admin-access`: login/refresh/logout e2e + lockout/session/audit integration.

## Anti-cheat rules

- Нельзя считать slice завершенным без acceptance scenario и минимального e2e контура.
- Нельзя заменять end-to-end проверку только unit coverage процентами.
- Нельзя пропускать проверку событий, аудита и error contract для write-heavy flows.
- Для seller storefront и узкой админки магазина verify должен отдельно подтверждать отсутствие delete UI в baseline scope, если destructive removal явно вне product direction.
- Для `FT-011` нельзя считать feature закрытой по одним unit/integration checks: нужен отдельный manual smoke `provision -> runtime restart/reset -> /shops/:publicPath`, подтверждающий, что storefront резолвится из persisted catalog state после restart.
- Для сценариев с polling или ботом проверка должна подтверждать реальный cross-slice flow, а не только isolated handler tests.
- Для `FT-014` нельзя считать customer status visibility закрытой по frontend polling consumer tests alone: verify must prove the checked-in runtime mounts the polling endpoint used by the Mini App, filters/scopes customer-visible events safely, and accepts the cursor/revision emitted by checkout success.
- Для `FT-005` нельзя считать `REQ-010` закрытым по одним integration/e2e тестам: нужен отдельный latency evidence bundle с явно зафиксированным p95 ownership в финальном verify step.
- Для `FT-006` нельзя считать feature закрытой по одним cancellation authorization тестам: verify обязан отдельно подтвердить paid-cancel `PENDING_MANUAL` visibility и последующий manual refund outcome/evidence без авто-refund side effects.
- Для `FT-003` и `FT-009` verify evidence включает: mock/runtime contract tests для Telegram adapter, Telegram test environment usage где применимо, и минимум один real Telegram Android прогон; обязательный blocking artifact для текущего closure — operator-confirmed notes, а screenshots/videos являются optional supporting evidence. Дополнительные `iOS/Desktop` прогоны сейчас желательны, но не blocking для closure, если отдельно не запрошены. При этом `FT-003` владеет language persistence/fallback assertions, а `FT-009` владеет shell/runtime closure.
- Для customer-facing Mini App нельзя закрывать визуально богатое или motion-heavy изменение только desktop/browser smoke, если change добавляет новые анимации, effect-heavy surfaces или тяжелый UI/runtime layer: verify обязан отдельно отметить weak Android Telegram behavior, scroll stability, fixed-bottom zones и graceful fallback.
- Для `FT-002` обязательны repo-local/mock runtime checks для auth/payment и transport/source verification, а real Mini App client-matrix evidence для customer-facing checkout UI закрывается в `FT-009`.

## Artifacts
- operator notes/logs and optional screenshots/videos → .tasks/TASK-XXX/
- in Memory Bank store only links + conclusions

## Repo-local catalog backend runner

- `npm run test:catalog:unit` runs `tests/slices/catalog/catalog.unit.spec.ts`.
- `npm run test:catalog:integration` runs `tests/slices/catalog/catalog.integration.spec.ts`.
- `npm run test:catalog:runtime` runs `tests/slices/catalog/catalog.runtime.integration.spec.ts` for the mounted repo-local runtime regressions, including restart-safe durability/conflict coverage.
- `npm run test:catalog` runs the checked-in backend catalog specs plus frontend catalog API/view-model and route/page smoke specs through the root Jest config.
