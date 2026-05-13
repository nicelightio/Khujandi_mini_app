---
description: Final security review and evidence closure report for TASK-FT018-07.
status: active
---
# TASK-FT018-07 Final Security Review

## Result

`PASS_WITH_BLOCKERS`.

FT-018 has passing production-negative runtime/auth/payment guard tests, passing reset/seed and fixed-persona session tests, sanitized UI QA API-fixture evidence, and static deploy isolation evidence. It cannot be classified as full `PASS` because required Docker Compose render evidence is unavailable, browser smoke is unavailable, full checkout browser path remains blocked by Telegram `initData`, and no staging deploy/branch gate was approved or executed.

`REQ-037` should not be marked verified from this evidence.

## Scope Confirmed

- Owning capability/slice: `runtime/testing enablement`.
- Owning contours: `mini-app`, `seller-web`, `admin-web`; `telegram-bot` only for evidence split/advisory runtime distinction.
- Touched layers: verification/protocol/task evidence docs only.
- Shared justification: none.

## Evidence Matrix

| FT-018 area | Status | Evidence |
|---|---|---|
| Production-negative test auth routes | `PASS` | Focused Jest tests prove disabled and production-like modes keep `/api/v1/test/personas`, `/api/v1/test/session`, `/api/v1/test/reset`, `/api/v1/test/seed` absent or refused; token failures return `403` when mounted. |
| Production-negative mock payment | `PASS` | Focused checkout runtime tests prove `PAYMENT_PROVIDER=mock` is refused in production and requires explicit non-production guard; `DEBUG=TRUE` alone does not create trusted checkout/payment. |
| Health | `PASS` | `/api/v1/health` exposes non-secret mode facts only; tests assert no token, cookie, session, raw Telegram payload, DB URL or payment secret fields. |
| Reset/seed | `PASS` | Reset/seed routes are staging-test guarded, token-gated, fixed-scenario only, controlled on invalid input, and implementation resets dev-runtime state without Docker/system/file cleanup. |
| Fixed personas | `PASS_WITH_LIMITATION` | `client_alina`, `seller_plov`, `admin_boss`, and `courier_7` are fixed. Arbitrary identity fields are rejected. Mini App/admin sessions use cookie primitives and JSON does not echo cookie values. `operator_manager` is a controlled unsupported persona. |
| UI QA fixture | `PARTIAL` | API smoke evidence from TASK-FT018-05 covers health/reset/seed/personas/session and stores cookie names/attributes only. Browser smoke is blocked by missing Playwright. |
| Full checkout browser path | `BLOCKED` | The current checkout UI still depends on Telegram WebApp `initData`. The fixture correctly avoids forging `initData` or adding an auth shortcut. |
| Compose/deploy isolation | `PARTIAL` | Static production/staging isolation, Traefik prefixing, runtime volume/path separation, redaction and dirty-check safety pass. Required production/staging `docker compose config` render is blocked locally. |
| Secret/session leakage | `PASS_WITH_SCOPE_LIMIT` | Reviewed UI QA evidence contains no token/cookie/session values, raw `initData`, payment secret or DB URL. Static search found only placeholders, code symbols and documented warnings in reviewed FT-018 artifacts. |
| Trust-boundary split | `PASS` | Specs, runbooks, fixture reports and task evidence explicitly keep UI QA/mock payment evidence separate from Telegram HMAC/replay/WebView and real provider payment trust. |

## Checks Run

- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand --testTimeout=30000` — `PASS`; 4 suites, 28 tests.
- `node --check tests/e2e/staging-ui-qa-fixture.mjs` — `PASS`.
- `npm run lint` — `PASS`.
- `git diff --check` — `PASS`.
- `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — `PASS`.
- Production `docker compose config` — `BLOCKED`; `docker` command not found.
- Staging `docker compose config` with explicit staging env — `BLOCKED`; `docker` command not found.
- Static reviewed-evidence leakage scan for token/cookie/session assignment markers — `PASS_WITH_SCOPE_LIMIT`; no tracked secret values found in reviewed evidence.

## Files Inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.protocols/TASK-FT018-01..07/*`
- `.tasks/TASK-FT018-01..06/*`
- `backend/src/dev-runtime/**`
- `tests/e2e/**`
- `tests/slices/checkout-payment/*runtime*.spec.ts`
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.env.example`

## Files Changed

- `.protocols/TASK-FT018-07/progress.md`
- `.protocols/TASK-FT018-07/verification.md`
- `.tasks/TASK-FT018-07/TASK-FT018-07-S-VERIFY-final-report-code-01.md`

## Blockers And Risks

- Docker Compose render is unavailable in this environment; static interpolation is not a substitute for `docker compose config`.
- Browser smoke is unavailable because Playwright package/browser runtime is missing.
- Full checkout browser flow is not verified because current checkout UI requires Telegram `initData`; resolving this needs an approved staging-only design, not fixture-side forging.
- No server deploy was run. Staging deploy remains blocked until branch/GitHub checkout, isolated env/secrets, Compose render and deploy approvals are complete.
- `operator_manager` remains controlled unsupported until admin-access dev runtime has a distinct seeded manager/operator account.

## Recommendation

Accept FT-018 as security-reviewed with blockers, keep `REQ-037` not verified, and run the missing gates in the next environment that has Docker Compose and Playwright. Do not deploy staging until the Compose render and GitHub/branch/env gates are complete.
