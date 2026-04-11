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

## Slice-based baseline

- `catalog`: public browse e2e + seller ownership integration coverage + shared storefront seller edit mode and `WORKING/NOT_WORKING` visibility checks for the planned seller contours.
- `checkout-payment`: paid order creation happy path, failed payment retry, auth validation.
- `mini app shell`: first-run language overlay, WebView-safe viewport, theme, lifecycle and action feedback smoke.
- `delivery-assignment`: admin assignment e2e + RBAC integration.
- `delivery-tracking`: status-machine integration, polling e2e, и отдельный polling-SLA verify artifact; functional closure принадлежит runtime tasks `FT-005`, а финальный latency gate для `REQ-010` закрывается только explicit SLA evidence.
- `order-cancellation`: allowed-role cancellation e2e + refund state/audit integration; final closure also requires explicit evidence that paid cancelled orders never remain without visible `refund_status`.
- `reviews-feedback`: two-sided bot review e2e + negative alert integration; docs-first boundary freeze belongs to `TASK-FT008-01`, while final functional closure belongs to `TASK-FT008-07`.
- `admin-access`: login/refresh/logout e2e + lockout/session/audit integration.

## Anti-cheat rules

- Нельзя считать slice завершенным без acceptance scenario и минимального e2e контура.
- Нельзя заменять end-to-end проверку только unit coverage процентами.
- Нельзя пропускать проверку событий, аудита и error contract для write-heavy flows.
- Для seller storefront и узкой админки магазина verify должен отдельно подтверждать отсутствие delete UI в baseline scope, если destructive removal явно вне product direction.
- Для сценариев с polling или ботом проверка должна подтверждать реальный cross-slice flow, а не только isolated handler tests.
- Для `FT-005` нельзя считать `REQ-010` закрытым по одним integration/e2e тестам: нужен отдельный latency evidence bundle с явно зафиксированным p95 ownership в финальном verify step.
- Для `FT-006` нельзя считать feature закрытой по одним cancellation authorization тестам: verify обязан отдельно подтвердить paid-cancel `PENDING_MANUAL` visibility и последующий manual refund outcome/evidence без авто-refund side effects.
- Для `FT-003` и `FT-009` verify evidence включает: mock/runtime contract tests для Telegram adapter, Telegram test environment usage где применимо, и минимум один real Telegram Android прогон; обязательный blocking artifact для текущего closure — operator-confirmed notes, а screenshots/videos являются optional supporting evidence. Дополнительные `iOS/Desktop` прогоны сейчас желательны, но не blocking для closure, если отдельно не запрошены. При этом `FT-003` владеет language persistence/fallback assertions, а `FT-009` владеет shell/runtime closure.
- Для `FT-002` обязательны repo-local/mock runtime checks для auth/payment и transport/source verification, а real Mini App client-matrix evidence для customer-facing checkout UI закрывается в `FT-009`.

## Artifacts
- operator notes/logs and optional screenshots/videos → .tasks/TASK-XXX/
- in Memory Bank store only links + conclusions

## Repo-local catalog backend runner

- `npm run test:catalog:unit` runs `tests/slices/catalog/catalog.unit.spec.ts`.
- `npm run test:catalog:integration` runs `tests/slices/catalog/catalog.integration.spec.ts`.
- `npm run test:catalog` runs the checked-in backend catalog specs plus frontend catalog API/view-model and route/page smoke specs through the root Jest config.
