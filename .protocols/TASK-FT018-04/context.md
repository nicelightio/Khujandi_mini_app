---
description: Execution context for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Context

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
- `.protocols/TASK-FT018-02/{context,plan,progress,verification}.md`
- `.protocols/TASK-FT018-03/{context,plan,progress,verification}.md`

## Ownership
- Owning capability/slice: `runtime/testing enablement`.
- Slice boundaries used by the harness:
  - `checkout-payment` owns Mini App HttpOnly cookie session primitives for `client_alina` and `seller_plov`;
  - `catalog` owns seller binding/seeded shop capability for `seller_plov`;
  - `admin-access` owns admin/operator cookie session primitives for `admin_boss` and `operator_manager`;
  - `delivery-assignment` / `delivery-tracking` own courier/order lifecycle seed compatibility for `courier_7`.
- Owning contours: `mini-app`, `seller-web` via Telegram-linked seller identity, `admin-web`; `telegram-bot` is represented only by a narrow test identity/session and does not prove real Telegram transport correctness.
- Task scope: guarded `GET /api/v1/test/personas` and `POST /api/v1/test/session`.
- Touched layers intended: test-only presentation endpoints, application fixed-persona session bootstrap, existing auth/session primitive integration and focused tests.
- Shared justification: no broad shared extraction. A small runtime guard helper may be reused from earlier FT-018 tasks if it already exists; do not create shared business/auth abstractions for the harness.

## Dependencies And State
- Depends on: `TASK-FT018-03`.
- Ready state: planned until local staging profile, reset and seed are available.
- Downstream unlocks: UI QA fixtures/workflow in later FT-018 tasks.

## Expected Touched Files
- `backend/src/dev-runtime/**/*`
- existing checkout-payment/admin-access/catalog auth/session integration points only where required to call normal primitives
- focused runtime/auth tests
- `.memory-bank/contracts/staging-test-auth-harness-contract.md` only if implementation finds documented endpoint drift and the orchestrator accepts the change
- `.tasks/TASK-FT018-04/**/*` final report/evidence

## Constraints
- Test session routes require `E2E_TEST_MODE=TRUE`, non-production mode and `X-E2E-Test-Token`.
- Routes must be absent or return `404` in production and when test mode is disabled.
- Missing or wrong token returns `403`.
- `POST /api/v1/test/session` accepts only fixed `persona` keys:
  - `client_alina`
  - `seller_plov`
  - `admin_boss`
  - `operator_manager`
  - `courier_7`
- Arbitrary identity fields such as `telegramId`, `userId`, `role`, `shopId`, `adminAccountId` and `password` must be rejected or ignored.
- Session cookie values must be set only through `Set-Cookie` and must not be echoed in JSON or logs.
- Do not weaken production Telegram `initData` auth, admin auth, seller access or payment trust.

## Acceptance Focus
- `/api/v1/test/personas` exposes only safe fixed persona metadata.
- `/api/v1/test/session` creates normal session cookies for fixed personas using existing owning auth contours where applicable.
- Negative tests prove production/disabled route absence, token rejection, unknown persona rejection and arbitrary identity rejection/ignore behavior.
