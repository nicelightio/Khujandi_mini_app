---
description: Testing policy for staging UI QA, Playwright workflows and trust-boundary separation.
status: active
---
# Staging UI QA

## Purpose

Define what browser/UI QA on staging can prove, how it obtains sessions, and which Telegram/payment trust checks remain outside Playwright workflow evidence.

## Required Runtime

Staging UI QA requires:

- `APP_ENV=staging`
- `NODE_ENV=staging`
- `DEBUG=TRUE`
- `PAYMENT_PROVIDER=mock`
- `E2E_TEST_MODE=TRUE`
- isolated staging state/volume/db paths

The UI QA runner receives:

- base URL through `UI_QA_BASE_URL`;
- test token through secret/ignored configuration;
- persona key through test fixture setup.

## Session Bootstrap Rule

UI QA must use `POST /api/v1/test/session` from [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md).

It must not:

- forge Telegram `initData`;
- use `initDataUnsafe` as authority;
- inject session ids into localStorage/sessionStorage;
- create arbitrary users by body fields;
- reuse production user identities.

## Repo-Local Fixture

The smallest repo-local fixture for `ui_qa`/Playwright consumption is:

- [tests/e2e/staging-ui-qa-fixture.mjs](../../tests/e2e/staging-ui-qa-fixture.mjs): calls health, reset, seed, personas and fixed-persona session endpoints from `UI_QA_BASE_URL`.
- [tests/e2e/README.md](../../tests/e2e/README.md): command examples and evidence rules.
- `playwright` is a repo `devDependency`; browser smoke still requires installed browser binaries/runtime, for example `npx playwright install chromium` on the machine that runs the smoke.

Required inputs:

```bash
UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win
E2E_TEST_TOKEN=<secret-from-env-or-ci>
```

Default client workflow preparation:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
UI_QA_SCENARIO=checkout_happy \
UI_QA_PERSONA=client_alina \
node tests/e2e/staging-ui-qa-fixture.mjs api-smoke
```

Optional browser smoke:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke
```

The browser smoke uses the fixed-persona HttpOnly cookie session produced by the harness. Checkout without Telegram `initData` is allowed only when backend checkout bootstrap explicitly reports `testSessionAuthAvailable=true`; otherwise the frontend must keep the normal Telegram auth requirement.

The fixture writes sanitized evidence to `.tasks/TASK-FT018-05/` by default and records cookie names/attributes only. It must not print or store `E2E_TEST_TOKEN`, cookie values, session values, raw `initData`, payment secrets or database URLs.

If Playwright browser runtime is unavailable, browser smoke is `BLOCKED/NOT RUN` with the exact missing prerequisite, while API fixture evidence remains valid for reset/seed/session consumption.

## Safe Workflow Matrix

| Workflow | Persona | Evidence type |
|---|---|---|
| Public catalog browse | none or `client_alina` | UI route/read smoke |
| Cart composition -> checkout -> mock paid order | `client_alina` | staging e2e with mock payment |
| Customer order status polling | `client_alina` | staging e2e over event/polling contract |
| Seller owned shop/status workflow | `seller_plov` | UI + server-side ownership session path |
| Admin/operator panel | `admin_boss` or `operator` | UI + admin session path |
| Negative no-session states | none/reset cookies | controlled auth UX |

## Trust Boundary Split

Staging UI QA can close browser workflow evidence only. It cannot close:

- Telegram HMAC validation;
- expired `auth_date`;
- replay guard;
- real Telegram WebView lifecycle/safe-area behavior;
- real provider payment callbacks/status confirmation.

Required separate checks:

- Mini App auth contract/runtime tests for raw `initData` negative and positive cases.
- Payment contract/runtime tests for provider trust and duplicate callback/idempotency.
- Advisory real Android Telegram run per [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md).

## Evidence Artifacts

Store detailed UI QA artifacts in `.tasks/TASK-XXX/`:

- command and env mode summary without secrets;
- base URL;
- scenario/persona keys;
- pass/fail outcome;
- relevant non-secret trace/log excerpt;
- optional screenshots/videos/traces.

Memory Bank should keep only summary conclusions and links.

## Required Negative Tests

Before accepting `FT-018` implementation:

- production-like runtime cannot use `/api/v1/test/session`;
- staging route rejects missing/wrong `X-E2E-Test-Token`;
- unknown persona returns controlled `400`;
- arbitrary identity fields are rejected or ignored;
- `DEBUG=TRUE` without `PAYMENT_PROVIDER=mock` cannot create trusted payment;
- `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` fails closed;
- session cookie values are not returned in JSON.

## Source Artifacts

- [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](../features/FT-018-staging-runtime-and-test-auth-harness.md): feature acceptance.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md): test session endpoints.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): operational workflow.
- [.memory-bank/testing/index.md](index.md): global testing strategy.
