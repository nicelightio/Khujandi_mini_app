---
description: UI QA report for FT-019 Staff panel local staging browser flow.
status: final
---
# FT-019 Staff Panel UI QA

## Verdict

PASS

- Tested URL: `http://127.0.0.1:5173/admin/staff`
- Environment: local staging through Vite proxy `/api`
- Health: `ok=true`, `appEnv=staging`, `nodeEnv=staging`, `paymentProvider=mock`, `e2eTestMode=true`, `version=dev`
- Browser: Chromium / Chrome for Testing `148.0.7778.96` via Playwright
- Date/time: 2026-05-14 10:01 +05

## Scope Alignment

- Owning feature: `FT-019 Staff panel`
- Contour: `admin-web`
- Capability/layers touched by QA: admin-web presentation, admin-access auth/session, Staff runtime API, delivery-assignment courier staff commands, admin-access operator staff commands, staff read models.
- Shared extraction: not applicable for QA.

## Docs And Code Consulted

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `backend/src/dev-runtime/routes/admin-staff.routes.ts`
- `frontend/src/admin/components/admin-staff-page.tsx`
- `frontend/src/admin/routes/admin-staff-route.tsx`
- `frontend/src/admin/app/router.tsx`
- `frontend/src/admin/api/admin-staff-api.ts`

## Flow Executed

1. Confirmed health and reset local staging state through guarded test reset.
2. Opened `/admin/staff`; logged in through real admin-web login as the seeded boss account. The password was not printed or stored in this report.
3. Verified `/admin` dashboard and protected shell navigation expose `Staff panel` for boss/admin.
4. Created courier through Staff UI using only Telegram user id and nickname; verified no email/password fields in courier form.
5. Verified courier row, `+1/-1` manual rating adjustment, soft deactivate, boss archive include inactive, reactivate, and courier detail card.
6. Created operator through Staff UI with email/nickname/password; verified no role selector and no admin/boss provisioning path.
7. Verified operator row, `+1/-1` processed-order rating adjustment, boss password reset one-time display/copy/dismiss, nickname update, soft deactivate/archive/reactivate, and operator detail card.
8. Verified sensitive/drift scan: no hard delete UI, no `passwordHash`, no persistent plaintext password after dismiss, no `OrderStatus.FAILED`, no generic CRM wording.
9. Logged in as a created operator and confirmed `/admin/staff` is denied and the nav entry is absent.
10. Rechecked reset-password login in browser: reset password authenticates operator, then `/admin/staff` shows forbidden.
11. Ran narrow/mobile viewport smoke at 390x844; no horizontal overflow detected.

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

None blocking. One non-product QA note: Playwright MCP initially required Chrome at `/opt/google/chrome/chrome`; local QA infrastructure was unblocked by installing Playwright Chromium and linking that path to the local browser runtime. No project source files were changed for this.

### Info

- Console captured expected auth-noise during login/logout transitions: unauthenticated refresh `401`, a `404` likely from a non-critical asset request, and an aborted logout request caused by navigation timing. No request failures blocked the Staff flow.
- The test harness `GET /api/v1/test/personas` exposes `admin_boss` and no `operator` persona. Operator denial was therefore tested with an operator account created through the Staff UI.
- `reports/ui-qa/playwright/staff-panel-FT019-local/summary.json` contains an intermediate tester-script FAIL for operator denial caused by an insufficient wait condition; the targeted browser repros below supersede it and pass.

## Evidence

- `reports/ui-qa/playwright/staff-panel-FT019-local/01-staff-loaded-boss.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/02-courier-created.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/03-courier-detail.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/04-operator-created-one-time-password.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/05-operator-detail.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/06-operator-access-repro.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/07-mobile-staff-panel.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/10-reset-password-browser-denial-recheck.png`
- `reports/ui-qa/playwright/staff-panel-FT019-local/operator-access-repro.json`
- `reports/ui-qa/playwright/staff-panel-FT019-local/reset-password-browser-denial-recheck.json`

## Residual Risks

- This is local staging UI QA. It does not prove production deployment, real Telegram WebView/HMAC behavior, or real payment-provider trust boundaries.
- Screenshots may include one-time non-secret test passwords generated for this flow; no real credentials, tokens, cookies, session values, raw `initData`, `.env` values, or database URLs are recorded in this report.

## Recommendation

Minor fixes are not required before release for the tested FT-019 Staff panel flow. Keep the existing non-browser unit/integration gates for Staff password/session and courier operational deactivation as release gates alongside this UI evidence.
