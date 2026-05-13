---
description: Superseding report for TASK-FT018-05 after Playwright devDependency and staging-only checkout harness.
status: active
---
# TASK-FT018-05 Superseding Report

## Result

`PASS_LOCAL_BROWSER_SMOKE`

The previous browser-smoke blocker was resolved by adding Playwright as a repo devDependency and implementing a staging-only checkout harness that uses the fixed-persona HttpOnly cookie session when backend bootstrap exposes `testSessionAuthAvailable=true`.

## Files Changed

- `tests/e2e/staging-ui-qa-fixture.mjs`
- `tests/e2e/README.md`
- `package.json`
- `package-lock.json`
- `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts`
- `frontend/src/slices/checkout-payment/hooks/use-checkout-payment-view-model.ts`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`

## Evidence

- Browser smoke: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T11-15-41-115Z.json`
- Scenario: `checkout_happy`
- Persona: `client_alina`
- Session transport: `httpOnlyCookie`
- Browser path: `/checkout`
- Browser result: `PASS`

Evidence remains sanitized: cookie names/attributes only, no token, cookie value, session value, raw `initData`, payment secret or database URL.

## Checks Run

- `node --check tests/e2e/staging-ui-qa-fixture.mjs` - PASS.
- `node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke` against local host-OS staging - PASS.
- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx --runInBand --testTimeout=30000` - PASS; 4 suites, 33 tests.
- `npm run build:frontend` - PASS.
- `npm run lint` - PASS.

## Residual Risk

This closes local staging UI workflow evidence only. It still does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.
