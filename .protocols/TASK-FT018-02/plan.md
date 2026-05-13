---
description: Implementation plan for TASK-FT018-02 runtime mode guards and health endpoint.
status: active
---
# TASK-FT018-02 Plan

## Steps

1. Re-read `TASK-FT018-01` outcome and FT-018 normative docs before touching files.
2. Inspect current repo-local API/runtime bootstrap and existing payment-provider guard path.
3. Add or tighten runtime mode parsing for:
   - `APP_ENV`
   - `NODE_ENV`
   - `DEBUG`
   - `PAYMENT_PROVIDER`
   - `E2E_TEST_MODE`
4. Enforce fail-closed behavior for production-like unsafe combinations before routes can expose test behavior.
5. Add `GET /api/v1/health` returning only non-secret mode facts and version/build identifier if safely available.
6. Update `.env.example` with non-secret staging placeholders only if missing or stale.
7. Add focused runtime/config tests for health response shape and production-negative guard cases.
8. Run checks:
   - focused runtime/config tests
   - `npm run lint`
   - `git diff --check`
9. Write `.tasks/TASK-FT018-02/TASK-FT018-02-S-IMPL-final-report-code-01.md` without marking downstream tasks complete.

## Guardrails

- Keep implementation KISS and local to runtime/config.
- Do not add a broad shared runtime framework.
- Do not mount `/api/v1/test/*` functionality beyond any route absence/guard scaffolding required for negative tests.
- Do not print or snapshot secrets in tests.
- Do not commit or push.

## Done Criteria

- Health endpoint is available in the intended runtime and contains no secrets.
- Production-like unsafe env combinations are covered by automated tests.
- `TASK-FT018-03` has a stable runtime guard base to build reset/seed on.
