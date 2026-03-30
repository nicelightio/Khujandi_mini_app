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
- Store screenshots/videos/traces in .tasks/TASK-XXX/
- In Memory Bank keep only links + short conclusions

## Slice-based baseline

- `catalog`: public browse e2e + seller ownership / soft-delete integration coverage.
- `checkout-payment`: paid order creation happy path, failed payment retry, auth validation.
- `mini app shell`: first-run language overlay, WebView-safe viewport, theme and action feedback smoke.
- `delivery-assignment`: admin assignment e2e + RBAC integration.
- `delivery-tracking`: status-machine integration, polling e2e, SLA verification.
- `order-cancellation`: allowed-role cancellation e2e + refund state/audit integration.
- `reviews-feedback`: two-sided bot review e2e + negative alert integration.
- `admin-access`: login/refresh/logout e2e + lockout/session/audit integration.

## Anti-cheat rules

- Нельзя считать slice завершенным без acceptance scenario и минимального e2e контура.
- Нельзя заменять end-to-end проверку только unit coverage процентами.
- Нельзя пропускать проверку событий, аудита и error contract для write-heavy flows.
- Для сценариев с polling или ботом проверка должна подтверждать реальный cross-slice flow, а не только isolated handler tests.

## Artifacts
- screenshots/logs/videos → .tasks/TASK-XXX/
- in Memory Bank store only links + conclusions
