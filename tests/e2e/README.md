---
description: Repo-local UI QA fixture entrypoints for staging reset/seed/fixed-persona sessions.
status: active
---
# E2E Fixtures

## Staging UI QA

Use `staging-ui-qa-fixture.mjs` to prepare a staging browser/UI QA run without hard-coding secrets:

```bash
UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win \
E2E_TEST_TOKEN=<secret-from-env-or-ci> \
node tests/e2e/staging-ui-qa-fixture.mjs api-smoke
```

The fixture calls:

- `GET /api/v1/health`
- `POST /api/v1/test/reset`
- `POST /api/v1/test/seed`
- `GET /api/v1/test/personas`
- `POST /api/v1/test/session`

It writes sanitized evidence to `.tasks/TASK-FT018-05/` by default. Evidence records cookie names/attributes only, never cookie values, session values, raw `initData`, payment secrets, database URLs or `E2E_TEST_TOKEN`.

Optional browser smoke:

```bash
UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win \
E2E_TEST_TOKEN=<secret-from-env-or-ci> \
node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke
```

Browser smoke requires the repo Playwright devDependency and an installed Playwright browser runtime. The checkout path uses the fixed-persona HttpOnly cookie session and skips Telegram auth only when backend checkout bootstrap reports `testSessionAuthAvailable=true`.

If Playwright browser runtime is unavailable, the fixture exits with a precise `BLOCKED` result and writes the missing prerequisite into evidence.

UI QA with test sessions proves only staging browser workflow behavior. It does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.

## Public Staging Checklist

Load secrets from ignored local config without printing values:

```bash
set -a
. ./.env
set +a
```

Preflight public staging before a Playwright run:

```bash
dig +short staging-tgmeal.natureonzoom.win
curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/health
```

The fixture expects normal system DNS resolution. If a local resolver still returns `NXDOMAIN` while public resolvers already know the Cloudflare record, record the run as DNS-blocked or use the runner's resolver configuration; do not treat an ad hoc browser-only resolver override as canonical evidence for the full fixture because API setup runs through Node fetch before the browser starts.

Useful env knobs:

- `UI_QA_BASE_URL`: staging origin, normally `https://staging-tgmeal.natureonzoom.win`.
- `E2E_TEST_TOKEN`: secret from ignored `.env` or CI.
- `UI_QA_SCENARIO`: seed scenario, default `checkout_happy`.
- `UI_QA_PERSONA`: fixed persona, default `client_alina`.
- `UI_QA_EVIDENCE_DIR`: sanitized evidence directory, default `.tasks/TASK-FT018-05`.

Route checklist for staging Playwright QA:

- Customer Mini App: `/`, `/shops`, `/shops/:publicPath`, `/checkout`, `/tracking?orderId=...&cursor=...`.
- Seller web: `/seller/shops/status`.
- Admin web: `/admin`, `/admin/login`, `/admin/catalog/shops/provision`, `/admin/orders/assignment`, `/admin/orders/cancellation`.

Staging Playwright QA intentionally does not close Telegram HMAC/WebView or real payment provider trust. Those checks remain in the Telegram Mini App verification runbook, payment-provider contract tests and separate production-like/advisory smoke.
