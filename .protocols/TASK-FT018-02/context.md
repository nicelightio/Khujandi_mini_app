---
description: Execution context for TASK-FT018-02 runtime mode guards and health endpoint.
status: active
---
# TASK-FT018-02 Context

## Source Specs Read
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/prd-to-tasks.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.protocols/FT-018/plan.md`
- `.protocols/FT-018/handoff.md`
- `.protocols/TASK-FT018-01/{context,plan,progress,verification}.md`

## Ownership
- Owning capability/slice: `runtime/testing enablement`; the mock-payment compatibility point belongs to `checkout-payment`, but this task owns only runtime guard wiring and health metadata.
- Owning contours: backend runtime serving `mini-app`, `seller-web` and `admin-web`; `telegram-bot` behavior is not changed.
- Task scope: runtime mode guards and non-secret `GET /api/v1/health`.
- Touched layers intended: backend runtime/config and test-only presentation surface; focused tests.
- Shared justification: no `shared` extraction by default. A tiny local runtime guard helper is allowed only if it prevents duplicated unsafe env checks across runtime/test endpoints.

## Dependencies And State
- Depends on: `TASK-FT018-01`.
- Ready state: planned until spec freeze/handoff is accepted by the orchestrator.
- Downstream unlocks: `TASK-FT018-03` local staging profile plus reset/seed endpoints.

## Expected Touched Files
- `backend/src/dev-runtime/**/*`
- `scripts/dev-api.ts`
- `.env.example`
- focused runtime tests under the existing test tree
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md` only if implementation changes the documented command shape
- `.tasks/TASK-FT018-02/**/*` final report/evidence

## Constraints
- `GET /api/v1/health` may be public only if it returns non-sensitive data.
- Health response must not expose secrets, token values, raw Telegram payloads, cookie/session values, database URLs or payment credentials.
- `E2E_TEST_MODE=TRUE` with `NODE_ENV=production` must fail closed before test-route mount or return production-safe `404`.
- `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` must fail closed before checkout trust.
- `DEBUG=TRUE` with `NODE_ENV=production` must not expose diagnostic/test behavior.
- Do not implement reset/seed or fixed-persona session endpoints in this task.
- Do not change production Telegram auth or real payment trust semantics.

## Acceptance Focus
- Runtime has explicit mode facts for `APP_ENV`, `NODE_ENV`, `DEBUG`, `PAYMENT_PROVIDER` and `E2E_TEST_MODE`.
- Production-like unsafe combinations are refused or fail closed.
- `/api/v1/health` returns only non-secret facts with a stable shape aligned to the contract.
