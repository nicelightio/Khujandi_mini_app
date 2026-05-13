---
description: Контекст выполнения TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Context

## Scope

- Task: `TASK-FT018-05`.
- Feature: `FT-018 Staging Runtime And Test Auth Harness`.
- Goal: подготовить Playwright/`ui_qa` consumption contract, fixtures/workflow docs и минимальный браузерный smoke для staging UI QA через fixed-persona test sessions.
- Mode: implementation task; не менять продуктовые auth/payment semantics и не считать UI QA доказательством Telegram/payment trust-boundary correctness.

## Required Spec Inputs Read

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

## Additional Context Inputs

- `.memory-bank/runbooks/e2e-mock-payment.md`
- `package.json`
- Existing repo paths found: `reports/ui-qa/playwright/*`, `frontend/src/tests/**/*`, `tests/slices/**/*`, `backend/src/dev-runtime/**/*`, `vite.config.mjs`.

## Micro-Check

- Owning capability/slice: `runtime/testing enablement`; not a product capability slice. Workflow evidence consumes `checkout-payment`, `catalog`, `admin-access`, `delivery-assignment` and `delivery-tracking` only through their existing contracts.
- Owning contour: primarily `mini-app`; also `admin-web` and `seller-web` for fixed-persona UI QA. `telegram-bot` remains a separate advisory/contract verification track and is not owned by this task.
- Touched layers: test/verification fixtures and workflow docs; possible frontend test harness only if required for browser smoke. No domain layer changes.
- Shared justification: no shared extraction justified. UI QA fixtures should remain test/runtime artifacts; do not introduce shared business abstractions.

## Boundaries

- Do not add a production login/backdoor.
- Do not forge Telegram `initData` or use `initDataUnsafe` as authority.
- Do not inject session IDs into `localStorage`/`sessionStorage`.
- Do not accept arbitrary identity fields; use only fixed personas from the staging test auth contract.
- Do not treat mock payment UI QA as proof of real provider correctness.
- Do not treat browser UI QA as proof of Telegram HMAC, `auth_date`, replay or real WebView lifecycle behavior.
- Do not print `E2E_TEST_TOKEN`, cookie values, session IDs, raw `initData`, payment secrets or database URLs.

## Dependencies And Assumptions

- Depends on `TASK-FT018-02` health/mode guard baseline.
- Depends on `TASK-FT018-03` reset/seed baseline.
- Depends on `TASK-FT018-04` fixed-persona `/api/v1/test/session` and `/api/v1/test/personas`.
- If those tasks are not implemented or fail verification, this task must report blocked rather than inventing alternate auth/payment shortcuts.

## Acceptance Focus

- `ui_qa`/Playwright can receive `UI_QA_BASE_URL` and secret `E2E_TEST_TOKEN` from ignored/secret sources.
- Fixture/workflow calls `POST /api/v1/test/reset`, `POST /api/v1/test/seed` and `POST /api/v1/test/session` with fixed persona keys.
- At least the `client_alina` catalog -> cart/composition -> checkout -> guarded mock paid order -> customer tracking happy path is documented and smoke-tested when runtime is available.
- Evidence artifacts go to `.tasks/TASK-FT018-05/`; Memory Bank receives only concise workflow/evidence summary if implementation changes docs.
