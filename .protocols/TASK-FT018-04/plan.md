---
description: Implementation plan for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Plan

## Steps

1. Re-read `TASK-FT018-03` verification outcome and the staging test auth harness contract before touching files.
2. Inspect existing Mini App, seller and admin session primitives to identify the narrow call points for fixed-persona bootstrap.
3. Add guarded `GET /api/v1/test/personas` returning safe fixed persona keys, contours and roles only.
4. Add guarded `POST /api/v1/test/session`:
   - validate fixed `persona`;
   - reject or ignore arbitrary identity fields;
   - call normal owning session primitives for Mini App and admin personas;
   - use seeded catalog binding for seller access;
   - keep courier test identity narrow and separate from real Telegram transport trust.
5. Ensure JSON response reports only non-secret session metadata such as transport and expiry; cookie values must stay only in `Set-Cookie`.
6. Add focused tests for:
   - production and disabled-mode `404`/fail-closed behavior;
   - missing/wrong token `403`;
   - personas response shape;
   - fixed persona session cookie creation;
   - unknown persona `400`;
   - arbitrary identity fields rejected or ignored;
   - no cookie/session value in JSON.
7. Run checks:
   - focused auth/runtime tests
   - `npm run lint`
   - `git diff --check`
8. Write `.tasks/TASK-FT018-04/TASK-FT018-04-S-IMPL-final-report-code-01.md`.

## Guardrails

- Do not create production backdoor accounts.
- Do not create arbitrary user/session creation APIs.
- Do not store session identifiers in JS-readable storage.
- Do not log `X-E2E-Test-Token`, cookie/session values, raw Telegram `initData`, bot tokens, payment secrets or DB URLs.
- Keep UI QA convenience separate from Telegram/payment trust-boundary evidence.
- Do not commit or push.

## Done Criteria

- Fixed personas can obtain normal runtime sessions in staging/test mode.
- Production and disabled modes cannot access test session routes.
- Session JSON and logs do not leak session identifiers or secrets.
- Later UI QA workflow can bootstrap personas through this endpoint without inventing auth shortcuts.
