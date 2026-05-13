---
description: Контекст выполнения TASK-FT018-07 security review and final verification/evidence closure.
status: active
---
# TASK-FT018-07 Context

## Scope

- Task: `TASK-FT018-07`.
- Feature: `FT-018 Staging Runtime And Test Auth Harness`.
- Goal: выполнить security review, negative guard verification и финальное evidence/Memory Bank closure для FT-018.
- Mode: reviewer/verifier style implementation task; no new product behavior unless a blocking security gap requires a small fix explicitly scoped by orchestrator.

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

- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- Verification notes from `.protocols/TASK-FT018-02` through `.protocols/TASK-FT018-06` when they exist.

## Micro-Check

- Owning capability/slice: `runtime/testing enablement`; final evidence spans consumer slices but must not move their product semantics.
- Owning contour: cross-contour verification for `mini-app`, `seller-web`, `admin-web`; `telegram-bot` only for advisory/trust-boundary separation evidence.
- Touched layers: verification artifacts, tests, docs/Memory Bank closure; implementation code only for tightly scoped security fixes if approved.
- Shared justification: no shared extraction justified during final verification. If repeated guard checks are missing, recommend a follow-up or narrowly scoped helper only with orchestrator approval.

## Boundaries

- Do not silently weaken production auth/payment trust boundaries to pass staging UI QA.
- Do not classify browser UI QA as Telegram raw `initData`/HMAC/replay correctness evidence.
- Do not classify mock payment smoke as real provider callback/status confirmation evidence.
- Do not print secrets, tokens, cookie/session values, raw Telegram payloads, payment secrets or `DATABASE_URL`.
- Do not run destructive server/Docker commands.
- Do not edit production infrastructure outside TgMeal-owned resources; server checks, if requested, must remain read-only unless orchestrator explicitly approves deploy action.

## Dependencies And Assumptions

- Depends on `TASK-FT018-02`, `TASK-FT018-03`, `TASK-FT018-04`, `TASK-FT018-05` and `TASK-FT018-06`.
- If any prerequisite is absent or failed, this task must produce a blocked/fail closure with precise missing evidence rather than marking FT-018 verified.
- Final RTM lifecycle for `REQ-037` remains an orchestrator-level product/spec decision; this task can recommend closure based on evidence.

## Acceptance Focus

- Production-negative guard tests prove test auth and mock payment cannot be enabled in production.
- Staging-positive tests prove health, reset/seed, fixed-persona sessions and UI QA workflow.
- Server staging deploy profile proves production/staging isolation.
- Security review proves no arbitrary identities, no cookie/session leakage, no secret logging and no production route exposure.
- Final evidence is written under `.tasks/TASK-FT018-07/` with Memory Bank summary/docs updates if implementation scope permits.
