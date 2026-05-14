---
description: UI QA report for staging admin-web workflows with guarded admin_boss persona.
status: final
---
# UI QA Report: Admin Web Staging

## Scope

- Project: `/home/serg/Projects/Khujandi_mini_app`
- Environment: staging
- URL: `https://staging-tgmeal.natureonzoom.win`
- Flow: admin-web protected shell, catalog shop provisioning read/form surface, operator assignment panel, cancellation/refund surface, login controlled state.
- Scenario/persona: `operator_orders` + `admin_boss`
- Time: 2026-05-13 18:21 +0500

## Specs And Docs Consulted

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- Focused implementation files for route behavior only: `frontend/src/admin/app/router.tsx`, admin route/page components, `backend/src/dev-runtime/staging-test-harness.ts`.

## Setup And Checks

- Ran guarded fixture with `UI_QA_SCENARIO=operator_orders` and `UI_QA_PERSONA=admin_boss`.
- Evidence: `reports/ui-qa/playwright/ui-qa-fixture-2026-05-13T13-15-18-360Z.json`
- The fixture reported `PASS`, staging health/test mode was available, and cookie/session values were not printed.
- Used Playwright MCP in a real browser with the fixed-persona admin cookie session.

## Steps Performed

1. Opened `/admin` without a session and verified protected route falls back to admin login with requested path.
2. Bootstrapped guarded `admin_boss` session and opened `/admin`.
3. Opened `/admin/login` while an admin cookie session existed.
4. Opened `/admin/catalog/shops/provision`; verified protected shell, existing shops read model, public path links, and provisioning form fields without submitting.
5. Opened `/admin/orders/assignment`; verified top alert, two order rows, severity/status/courier/latest-message/action cells, sorting controls, and history toggles.
6. Opened status-control confirmation for delivered order and dismissed it before mutation.
7. Opened `/admin/orders/cancellation`; verified cancellation reason control, refund status visibility, refund outcome control, and refund note enabling the submit button without submitting.

## Findings

### Critical

None.

### High

None.

### Medium

1. Assignment history expansion is empty for seeded operator orders.
   - Repro: seed `operator_orders`, open `/admin/orders/assignment`, expand history for `test-order-created-1001` or `test-order-delivered-2001`.
   - Expected: FT-016 requires expandable status history rows with status, timing, actor role/name and comments where available.
   - Actual: both expanded rows show `Истории статусов пока нет.`
   - Evidence: `reports/ui-qa/playwright/snapshot-admin-assignment-history.yml`
   - Recommendation: seed/read-model should provide at least canonical status history rows for the guarded operator scenario, especially the delivered order.

2. Direct `/admin/login` does not restore an already-authenticated admin cookie session after page reload.
   - Repro: bootstrap `admin_boss`, verify `/admin` shows protected shell, then hard-navigate to `/admin/login`.
   - Expected: controlled already-authenticated state should redirect/show protected admin state, or at least refresh the cookie session before showing login.
   - Actual: login form is shown with anonymous copy and no session restoration.
   - Evidence: `reports/ui-qa/playwright/snapshot-admin-login-auth.yml`
   - Recommendation: make `/admin/login` attempt refresh when cookie session may exist, or redirect authenticated users after a direct route load.

### Low

1. Cancellation/refund page is available but not data-linked to the `operator_orders` scenario in the browser-visible read surface.
   - Repro: after `operator_orders`, open `/admin/orders/cancellation`.
   - Actual: page shows a fixed `Заказ #2004` surface with cancellation/refund controls; it does not expose an order selector or seeded `test-order-*` read context.
   - Evidence: `reports/ui-qa/playwright/snapshot-admin-cancellation.yml`
   - Risk: UI surface is testable, but staging browser QA cannot prove scenario-level cancellation selection without performing a destructive command.

### Info

- `/admin` protected shell passed with `admin_boss`: dashboard, nav, actor label and idle deadline were visible.
- `/admin/catalog/shops/provision` passed read/form availability: two seeded shops were visible and the create form was present; no shop was created.
- Assignment action affordances were visible: offer buttons on unassigned order, disabled unavailable actions, delivered-order status control with confirmation. The confirmation dialog was dismissed.
- Refund note field correctly enabled `Записать результат возврата`; submit was not clicked.
- Console errors included the expected initial unauthenticated `401` refresh and a failed loopback fetch from a discarded QA bootstrap attempt, not an app route failure after authenticated navigation.
- UI QA does not prove Telegram HMAC/WebView correctness or real payment provider trust.

## Browser Artifacts

- `reports/ui-qa/playwright/snapshot-admin-unauth.yml`
- `reports/ui-qa/playwright/snapshot-admin-dashboard-auth.yml`
- `reports/ui-qa/playwright/snapshot-admin-login-auth.yml`
- `reports/ui-qa/playwright/snapshot-admin-provision.yml`
- `reports/ui-qa/playwright/snapshot-admin-assignment.yml`
- `reports/ui-qa/playwright/snapshot-admin-assignment-history.yml`
- `reports/ui-qa/playwright/snapshot-admin-cancellation.yml`
- `reports/ui-qa/playwright/snapshot-admin-cancellation-note-enabled.yml`
- `reports/ui-qa/playwright/admin-provision.png`
- `reports/ui-qa/playwright/admin-assignment.png`
- `reports/ui-qa/playwright/admin-cancellation-note-enabled.png`
- `reports/ui-qa/playwright/console-errors-all.log`
- `reports/ui-qa/playwright/network-requests.log`

## Residual Risks

- Destructive writes were intentionally not submitted: no cancellation, refund update, manual offer, broadcast offer, logout, or status completion was committed.
- `operator_manager` is not listed as supported by the deployed personas endpoint; `admin_boss` was used for admin/operator checks.
- Browser QA covered staging fixed-persona behavior only; Telegram bot chat execution remains outside this run.
