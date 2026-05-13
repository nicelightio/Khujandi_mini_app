---
description: Implementation handoff for FT-018 staging runtime and staging-only test auth harness.
status: active
---
# IMPL-FT-018 Staging Runtime And Test Auth Harness

## Goals

- Add a real staging runtime profile that runs locally on host OS and on the dev/staging server.
- Keep staging state/volumes/db separate from production.
- Add staging-only fixed-persona test auth harness for UI QA/Playwright.
- Keep production Telegram auth and payment trust boundaries unchanged.
- Give `ui_qa` a deterministic URL, reset/seed workflow and safe session bootstrap.

## Source Artifacts

- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `doc/ARCHITECTURE.md`

## Normative Inputs

- `E2E_TEST_MODE=TRUE` is required for test auth routes.
- `NODE_ENV=production` forbids test auth route mounting and mock payment.
- Human-facing staging uses `NODE_ENV=staging`; isolated automated tests may still use `NODE_ENV=test` as long as explicit `APP_ENV` or `E2E_TEST_MODE` guard is present.
- `PAYMENT_PROVIDER=mock` remains the only server-side mock payment selector.
- Test sessions are fixed-persona only and must use normal auth/session primitives.
- Staging deploy must use separate Compose project, host, volume and logs.
- UI QA evidence is separate from Telegram auth correctness.

## Ownership And Boundaries

- Owning capability: runtime/testing enablement.
- Touched contours: `mini-app`, `seller-web`, `admin-web`; `telegram-bot` only for contract/advisory evidence separation.
- Touched layers: runtime config, backend test-only presentation/application endpoints, deploy scripts/docs, tests.
- Slice ownership:
  - `checkout-payment`: Mini App test session primitive and mock payment guard compatibility.
  - `catalog`: seller persona binding and seeded storefront data.
  - `admin-access`: admin/operator test session primitive.
  - `delivery-assignment` / `delivery-tracking`: courier persona and workflow seed data where needed.
- Shared extraction is not justified except for a narrow env guard helper if repeated checks appear in more than one route module.

## Implementation Waves

### TASK-FT018-01 - Spec freeze and handoff

- Scope: docs only.
- Files: feature spec, contract, runbook, testing policy, implementation handoff, protocol handoff, indexes.
- Verify: docs link to source artifacts and state production guard rules.
- Quality gates: `git diff --check`; markdown links for changed Memory Bank docs.

### TASK-FT018-02 - Runtime mode guards and health endpoint

- Scope: backend runtime/config only.
- Files: `backend/src/dev-runtime/**/*`, `scripts/dev-api.ts`, `.env.example`, tests.
- Verify: `/api/v1/health` returns non-secret mode facts; production-like runtime refuses unsafe env combinations.
- Quality gates: focused runtime config tests, `npm run lint`, `git diff --check`.

### TASK-FT018-03 - Local staging profile, reset and seed

- Scope: host-OS staging state paths and test reset/seed endpoints.
- Files: backend dev-runtime routes/state modules, tests, runbook update.
- Verify: local staging starts with isolated `.runtime/staging/*`; reset/seed restores deterministic baseline only for staging state.
- Quality gates: focused runtime tests, local smoke, `git diff --check`.

### TASK-FT018-04 - Fixed-persona test session endpoint

- Scope: `/api/v1/test/session` and `/api/v1/test/personas`.
- Files: backend dev-runtime auth/test routes, checkout-payment/admin-access/catalog test integration, tests.
- Verify: fixed personas create normal cookies; arbitrary identity fields are rejected/ignored; production and disabled modes return `404`; wrong token returns `403`.
- Quality gates: focused auth/runtime tests, no cookie value in JSON/log tests, `npm run lint`, `git diff --check`.

### TASK-FT018-05 - UI QA fixtures and workflow docs

- Scope: Playwright/ui_qa consumption contract, no broad UI changes unless fixture hooks require it.
- Files: tests/e2e or UI QA fixtures if present, `.memory-bank/testing/staging-ui-qa.md`, runbook.
- Verify: `ui_qa` can receive `UI_QA_BASE_URL`, call session bootstrap and run at least client checkout happy path with mock payment.
- Quality gates: local browser smoke or documented UI QA run, frontend build if UI code changes.

### TASK-FT018-06 - Server staging deploy profile

- Scope: Compose/deploy parameterization for staging server.
- Files: `docker-compose.yml`, deploy script/config docs, runbook; no production deploy behavior regression.
- Verify: `docker compose config` works for production and staging; router/service/volume names do not collide; health checks hit staging host.
- Quality gates: compose config for both modes, deploy script dry-run/read review, no destructive operations.

### TASK-FT018-07 - Security review and final verification

- Scope: docs/evidence closure and negative guard verification.
- Files: `.tasks/TASK-FT018-07/**/*`, Memory Bank summaries.
- Verify: production-negative tests, staging positive tests, UI QA workflow, no secret leakage, separate evidence tracks.
- Quality gates: `npm run lint`, focused tests, frontend build if touched, `git diff --check`.

## Expected Touched Files

- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.protocols/FT-018/*`
- `scripts/dev-api.ts`
- `backend/src/dev-runtime/**/*`
- `tests/slices/**/*` or new runtime/e2e tests
- `.env.example`
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`

## Tests

- Runtime config guards for `NODE_ENV`, `APP_ENV`, `DEBUG`, `PAYMENT_PROVIDER`, `E2E_TEST_MODE`.
- Health endpoint returns only non-secret facts.
- Test endpoints are absent/404 outside staging test mode.
- Token guard returns `403` for missing/wrong token.
- Fixed personas create expected cookies via existing auth/session primitives.
- Arbitrary identity fields cannot create a custom user/session.
- Reset/seed touches only staging state.
- Mock payment happy path remains server-side and non-production guarded.
- Production compose/deploy config is not broken by staging parameterization.

## UAT Steps

1. Start local staging API and frontend with the documented env.
2. Check `/api/v1/health`.
3. Reset and seed `checkout_happy`.
4. Bootstrap `client_alina`, run catalog -> checkout -> mock paid order -> tracking.
5. Bootstrap `seller_plov`, verify owned seller surface.
6. Bootstrap `admin_boss`, verify admin/operator surface.
7. Start production-like runtime with test flags and verify fail-closed behavior.
8. Render staging Compose config and verify distinct project/volume/router names.

## Risks

- Accidental production test auth route exposure.
- Accidental production mock payment enablement.
- Staging/prod volume or Traefik router collision.
- False confidence from UI QA being treated as Telegram auth evidence.
- Secret leakage through health/test logs.
- Over-broad shared abstraction for one test harness.

## Constraints

- Do not introduce production backdoor login.
- Do not accept arbitrary test identities.
- Do not store session identifiers in JS-readable storage.
- Do not print secrets/tokens/session values.
- Do not touch PhotoChanger, Traefik configs or unrelated host infrastructure during staging deploy.
