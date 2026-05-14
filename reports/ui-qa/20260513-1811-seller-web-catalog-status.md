---
description: UI QA report for staging seller-web catalog owner workflow.
status: active
---
# UI QA Report: Seller Web Catalog Status

## Scope

- Date/time: 2026-05-13 18:11 Asia/Dushanbe
- Target URL: `https://staging-tgmeal.natureonzoom.win`
- Requested flow: seller-web/catalog owner workflow with `checkout_happy` and `seller_plov`
- Environment: public staging, `APP_ENV=staging`, `NODE_ENV=staging`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=true`
- Owning slice/contours: `catalog`; `seller-web` and shared storefront in `mini-app`
- Touched files: report/evidence only; source code was not modified

## Specs And Docs Consulted

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `frontend/src/seller/components/seller-shop-status-page.tsx`
- `frontend/src/seller/api/seller-shop-status-api.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`

## Checks Performed

- Ran guarded fixture with `UI_QA_SCENARIO=checkout_happy` and `UI_QA_PERSONA=seller_plov`: PASS.
- Used Playwright browser automation with fixed-persona HttpOnly cookie session. The browser flow avoided printing token/cookie/session values.
- Verified `/seller/shops/status` loads one owned shop row for `Плов в парке Сомони`.
- Verified status workflow: `WORKING -> NOT_WORKING -> WORKING`, then confirmed the shop was restored to `WORKING`.
- Verified public visibility via API and browser:
  - while `NOT_WORKING`, public `/api/v1/shops` did not contain the owned shop;
  - while `NOT_WORKING`, owning seller could still open `/shops/plov-v-parke-somoni` with edit mode active;
  - while `NOT_WORKING`, anonymous public storefront did not expose the shop;
  - after restoring `WORKING`, public `/api/v1/shops` and public storefront exposed the shop again.
- Checked visible `button`, `a`, and `role=button` controls for destructive `delete/remove/destroy/удал/ҳазф` actions on seller status and storefront surfaces: none found.
- Checked browser console/network failures in the authenticated flow: no console warnings/errors and no failed app responses recorded.

## Result Summary

The requested seller owner workflow passes functionally on staging. The guarded harness works, seller-owned rows are visible, the status toggle persists safely, public `WORKING/NOT_WORKING` visibility behaves as specified, owner access to a `NOT_WORKING` storefront remains available, and no destructive delete UI was visible.

## Findings

### Critical

None.

### High

None.

### Medium

#### M-1: `/seller/shops/status` renders as a raw browser-default form

- Route: `/seller/shops/status`
- Evidence: `reports/ui-qa/playwright/seller-20260513-1310-status-flow/02-status-not_working.png`
- Reproduction:
  1. Bootstrap `checkout_happy` and fixed persona `seller_plov`.
  2. Open `/seller/shops/status`.
  3. Toggle the owned shop to `NOT_WORKING`.
- Expected: narrow seller-web control remains simple, but should still look like a deliberate app surface.
- Actual: the page uses plain default browser typography, fieldset, select, and button styling.
- Recommended fix: add minimal seller-web layout/form styling consistent with the app shell while keeping the surface narrow.

### Low

#### L-1: Public hidden-storefront error view exposes staging debug/admin blocks

- Route: `/shops/plov-v-parke-somoni` while the shop is `NOT_WORKING`
- Evidence: `reports/ui-qa/playwright/seller-20260513-1325-visibility-flow/02-public-not-working-language-set.png`
- Reproduction:
  1. Set owned shop to `NOT_WORKING`.
  2. Open the public storefront route without seller session.
- Expected: public user sees a clean unavailable/not-found state and no seller/admin affordances.
- Actual: the shop itself is hidden correctly, but the page also shows `ADMIN INTERFACES` and `DEBUG MODE` blocks in the public context.
- Recommended fix: keep `DEBUG=TRUE` staging diagnostics gated away from customer-visible fallback content, or make the fallback explicitly staging-only and visually separated.

### Info

- `seller_plov` session used the documented fixed-persona harness and normal HttpOnly cookie transport.
- First storefront visibility attempt without language state correctly hit the first-run language overlay; the final visibility check was repeated with `khujandi.language=ru` so it measured storefront visibility rather than language gating.
- This UI QA does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.

## Browser Artifacts

- Fixture evidence: `.tasks/TASK-UIQA-20260513/seller/ui-qa-fixture-2026-05-13T13-05-39-689Z.json`
- Authenticated status flow summary: `reports/ui-qa/playwright/seller-20260513-1310-status-flow/summary.json`
- Visibility flow summary: `reports/ui-qa/playwright/seller-20260513-1325-visibility-flow/summary.json`
- Task-local summaries:
  - `.tasks/TASK-UIQA-20260513/seller/browser-summary.json`
  - `.tasks/TASK-UIQA-20260513/seller/visibility-summary.json`
- MCP public snapshot: `reports/ui-qa/playwright/page-2026-05-13T13-05-49-023Z.yml`

## Coverage Gaps And Uncertainty

- The status toggle was exercised only for the seeded owned shop from `checkout_happy`.
- Foreign-seller/no-session negative seller-web access was not re-tested in this pass.
- Admin provisioning was not in scope for this seller-focused run.

## Recommendation

Accept the functional seller-web/catalog status workflow for staging, with follow-up polish for the raw seller status UI and public fallback/debug exposure before broader UAT.
