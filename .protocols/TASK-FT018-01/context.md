---
description: Execution context for TASK-FT018-01 FT-018 spec freeze and handoff.
status: active
---
# TASK-FT018-01 Context

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

## Ownership
- Owning capability/slice: `runtime/testing enablement`; this is not a customer product slice.
- Owning contours: documentation covers `mini-app`, `seller-web`, `admin-web`, and `telegram-bot` as a separate advisory/contract verification track.
- Task scope: docs-only foundation freeze for FT-018 source specs, implementation plan and handoff.
- Touched layers intended: Memory Bank/spec layer and protocol handoff only.
- Shared justification: no `shared` extraction is justified; this task creates no runtime code.

## Dependencies And State
- Depends on: none.
- Ready state: foundation task, already ready to execute as docs/protocol verification.
- Downstream unlocks: `TASK-FT018-02` runtime mode guards and health endpoint.

## Constraints
- Do not edit implementation code.
- Do not change product/security behavior beyond existing FT-018 docs.
- Do not introduce new endpoint semantics beyond `.memory-bank/contracts/staging-test-auth-harness-contract.md`.
- Do not edit `.memory-bank/tasks/backlog.md` unless the orchestrator explicitly asks.
- Preserve production trust boundaries:
  - no production test auth endpoint;
  - no production mock payment;
  - no arbitrary test identities;
  - no session values or secrets in docs/logs.

## Acceptance Focus
- FT-018 normative docs link to source artifacts and agree on guard rules.
- Handoff clearly states local/server staging shape, fixed-persona harness, reset/seed lifecycle and UI QA evidence split.
- Remaining implementation tasks are decomposed narrowly enough for `/execute`.
