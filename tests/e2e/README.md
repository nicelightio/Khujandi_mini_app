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
UI_QA_BASE_URL=http://127.0.0.1:5173 \
E2E_TEST_TOKEN=<secret-from-env-or-ci> \
node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke
```

Browser smoke requires the repo Playwright devDependency and an installed Playwright browser runtime. The checkout path uses the fixed-persona HttpOnly cookie session and skips Telegram auth only when backend checkout bootstrap reports `testSessionAuthAvailable=true`.

If Playwright browser runtime is unavailable, the fixture exits with a precise `BLOCKED` result and writes the missing prerequisite into evidence.

UI QA with test sessions proves only staging browser workflow behavior. It does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.
