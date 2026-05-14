---
description: UI QA report for staging customer mini-app checkout flow.
status: active
---
# UI QA Report: Customer Mini App Staging

## Scope

- Date/time: 2026-05-13 18:00 Asia/Dushanbe
- Target URL: `https://staging-tgmeal.natureonzoom.win`
- Requested flow: customer mini-app, `checkout_happy`, `client_alina`
- Environment: public staging, `APP_ENV=staging`, `NODE_ENV=staging`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=true`
- Owning contours/slices under test: `mini-app`; `catalog`, `checkout-payment`, `delivery-tracking`
- Touched files: report/evidence only; source code was not modified

## Specs And Docs Consulted

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`

## Checks Performed

- Ran guarded repo fixture:
  - `api-smoke`: PASS, evidence `.tasks/TASK-UIQA-20260513/customer/ui-qa-fixture-2026-05-13T12-45-50-432Z.json`
  - `browser-smoke`: PASS, evidence `.tasks/TASK-UIQA-20260513/customer/ui-qa-fixture-2026-05-13T12-56-07-404Z.json`
- Used Playwright browser automation against staging with fixed persona `client_alina`.
- Verified:
  - `/` language selection to `ru` and start showcase content.
  - `/shops` list.
  - `/shops/seller-runtime-11` direct storefront.
  - Product tap adds `Плов зарвода` to composition state.
  - Natural storefront checkout handoff.
  - `/checkout` guarded mock payment through documented sessionStorage handoff workaround.
  - Successful order creation and `/tracking?orderId=order-runtime-1&cursor=0`.

## Result Summary

The guarded staging harness is working and downstream checkout/payment/tracking works when the checkout composition handoff is provided directly. The natural customer UI flow is blocked on the storefront: after adding a product, the cart summary and `Continue to checkout` CTA exist in DOM but are hidden from the user.

## Findings

### Critical

None.

### High

#### H-1: Customer cannot proceed from storefront cart to checkout

- Route: `/shops/seller-runtime-11`
- Severity: High, major
- Evidence:
  - Product card selected: `data-storefront-product-selected="true"`
  - Visible controls after add: `["-", "+", "Copy logs"]`
  - Hidden cart summary selector: `[data-storefront-cart="summary"]`
  - Hidden checkout selector: `[data-storefront-cart="checkout"]`
  - DOM text exists: `Order draft...Checkout ready...Continue to checkout`
  - Computed summary display: `display: none`
  - Checkout button: `disabled=false`, but bounding rect `0x0`
  - Screenshot: `reports/ui-qa/playwright/customer-20260513-1258-storefront-blocker/storefront-after-add-no-visible-checkout.png`
  - Implementation evidence inspected: `frontend/src/slices/catalog/styles/catalog-storefront.css:373` hides `[data-storefront-cart="summary"]` in browse mode while `frontend/src/slices/catalog/components/catalog-page.tsx:589` contains the cart/checkout UI inside that summary.
- Reproduction:
  1. Prepare staging with `checkout_happy` and `client_alina`.
  2. Open `/shops/seller-runtime-11`.
  3. Tap `Плов зарвода`.
  4. Observe quantity badge/inline counter.
  5. Try to proceed to checkout as a normal user.
- Expected: customer sees cart/composition summary and a reachable checkout CTA.
- Actual: only quantity controls are visible; no visible checkout action exists.
- Recommended fix: keep customer browse simplification, but expose a compact visible cart/checkout affordance outside the hidden summary, or stop hiding the checkout part of the cart summary for `data-can-edit="false"`.

### Medium

#### M-1: Root showcase and `/shops` list are visually degraded on mobile staging

- Routes: `/`, `/shops`
- Severity: Medium, major UX polish issue
- Evidence:
  - Root body sample: duplicate `Сегодня популярны`; favorite links concatenate as `Плов в парке СомониБобоча самбусавесь Худжанд`; product/price text runs together.
  - `/shops` list renders mostly as plain links/lists and also exposes `ADMIN INTERFACES` plus `DEBUG MODE` in the customer route.
  - Screenshots:
    - `reports/ui-qa/playwright/customer-20260513-1303-root-loaded-nosplash/root-showcase-loaded-no-splash.png`
    - `reports/ui-qa/playwright/customer-20260513-1302-shops-loaded-nosplash/shops-list-loaded-no-splash.png`
- Expected: customer mini-app showcase/list should be scan-friendly and not look like raw document flow.
- Actual: root/list pages are hard to scan, with concatenated links/text and developer/admin/debug surfaces visible in customer context.
- Recommended fix: add/restore customer catalog/showcase/list layout styling and review whether admin/debug surfaces should be hidden or clearly gated for customer QA routes even when `DEBUG=TRUE`.

### Low

#### L-1: `/shops` list does not expose requested primary public path

- Route: `/shops`
- Severity: Low, minor
- Evidence:
  - Actual list links: `/shops/plov-v-parke-somoni`, `/shops/bobocha-sambusa`
  - Requested route `/shops/seller-runtime-11` works when opened directly.
- Expected: not strictly a spec failure because public routing can have primary/secondary paths, but this matters for QA handoff if `seller-runtime-11` is the canonical requested fixture route.
- Recommended fix: document that `/shops` displays vanity paths, or expose/copy the primary fixture path in debug diagnostics.

### Info

- Fixture/browser evidence confirms guarded staging mode and `client_alina` HttpOnly cookie session bootstrap. Cookie/session values were not printed or stored.
- Downstream `/checkout` and `/tracking` passed through documented handoff workaround:
  - Screenshot: `reports/ui-qa/playwright/customer-20260513-1257-downstream/01-checkout-ready-handoff-workaround.png`
  - Screenshot: `reports/ui-qa/playwright/customer-20260513-1257-downstream/02-checkout-success-handoff-workaround.png`
  - Screenshot: `reports/ui-qa/playwright/customer-20260513-1257-downstream/03-tracking-created-handoff-workaround.png`
  - Result: `/tracking?orderId=order-runtime-1&cursor=0`, `Текущий статус: CREATED`, `Заказ оплачен и ожидает назначения курьера`.
- One Cloudflare RUM request ended with `net::ERR_ABORTED`; this did not block app behavior.
- Two transient network/setup failures were seen before successful runs: one `fetch failed`, one `ECONNRESET` on health. Re-runs succeeded; treat as residual staging/network flake unless it repeats.

## Browser Artifacts

- MCP snapshot: `reports/ui-qa/playwright/mcp-root-before-session.yml`
- Storefront blocker evidence: `reports/ui-qa/playwright/customer-20260513-1258-storefront-blocker/summary.json`
- Downstream checkout/tracking evidence: `reports/ui-qa/playwright/customer-20260513-1257-downstream/summary.json`
- Root loaded evidence: `reports/ui-qa/playwright/customer-20260513-1303-root-loaded-nosplash/summary.json`
- Shops loaded evidence: `reports/ui-qa/playwright/customer-20260513-1302-shops-loaded-nosplash/summary.json`

## Coverage Gaps And Uncertainty

- Natural end-to-end customer flow is not fully passed because H-1 blocks storefront-to-checkout as a real user.
- Checkout/tracking PASS was verified through the documented staging handoff workaround, so it proves downstream route behavior but not the natural storefront CTA path.
- This UI QA does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust; those remain separate trust-boundary checks per Memory Bank.

## Recommendation

Fix H-1 before accepting the staging customer checkout flow. After that, re-run the same `checkout_happy`/`client_alina` Playwright pass without sessionStorage/programmatic handoff and verify root/list visual polish regressions separately.
