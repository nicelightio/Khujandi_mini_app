---
description: Execution context for TASK-FT018-03 local staging profile plus guarded reset and seed endpoints.
status: active
---
# TASK-FT018-03 Context

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

## Ownership
- Owning capability/slice: `runtime/testing enablement`; seeded data may touch slice-owned runtime fixtures for `catalog`, `checkout-payment`, `admin-access`, `delivery-assignment` and `delivery-tracking` only through explicit test/staging harness boundaries.
- Owning contours: local staging backend/runtime for `mini-app`, `seller-web` and `admin-web`; no real `telegram-bot` transport changes.
- Task scope: host-OS local staging profile plus guarded `POST /api/v1/test/reset` and `POST /api/v1/test/seed`.
- Touched layers intended: runtime config, test-only presentation endpoints, application reset/seed orchestration and staging-only local state infrastructure.
- Shared justification: no `shared` extraction by default. Keep reset/seed orchestration local to staging/test harness unless repeated env-guard code from `TASK-FT018-02` warrants a tiny local helper.

## Dependencies And State
- Depends on: `TASK-FT018-02`.
- Ready state: planned until runtime mode guards and health endpoint pass.
- Downstream unlocks: `TASK-FT018-04` fixed-persona `/api/v1/test/session` and `/api/v1/test/personas`.

## Expected Touched Files
- `backend/src/dev-runtime/**/*`
- `scripts/dev-api.ts` if local staging command/env support needs runtime bootstrap changes
- tests for staging reset/seed route and state isolation
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md` only if the local command/reset/seed shape changes
- `.tasks/TASK-FT018-03/**/*` final report/evidence

## Constraints
- Test endpoints require enabled staging/test mode and `X-E2E-Test-Token`.
- Missing or wrong token returns `403` when the route is mounted.
- Disabled test mode or production-like runtime returns `404` or fails closed.
- Reset may affect only staging-owned local state such as `.runtime/staging/*`, configured staging DB paths or in-memory runtime state.
- Reset must not touch production volumes, production DB, shared infrastructure, Docker system cleanup or unrelated project resources.
- Seed data must be deterministic and must not depend on production identities.
- Do not implement fixed-persona session creation in this task.

## Acceptance Focus
- Local host-OS staging can start with isolated `.runtime/staging/*` paths.
- `POST /api/v1/test/reset` and `POST /api/v1/test/seed` are guarded and deterministic.
- Baseline seed scenarios are sufficient for later persona/session work without inventing new product behavior.
