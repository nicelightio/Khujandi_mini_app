---
description: Implementation plan for TASK-FT018-01 FT-018 spec freeze and handoff.
status: active
---
# TASK-FT018-01 Plan

## Steps

1. Read required operating, architecture, feature, contract, runbook, testing, implementation-plan and protocol-handoff context.
2. Verify the FT-018 source docs consistently define:
   - explicit non-production staging flags;
   - production refusal for test auth and mock payment;
   - token guard for public staging test endpoints;
   - fixed personas only;
   - UI QA evidence split from Telegram/payment trust-boundary tests.
3. If a docs drift is found, update only FT-018 Memory Bank/protocol docs needed to make the handoff internally consistent.
4. Do not edit implementation code, runtime config, deploy config or backlog cards.
5. Run documentation hygiene:
   - `git diff --check`
   - changed markdown local link validation if links changed.
6. Write `.tasks/TASK-FT018-01/TASK-FT018-01-S-IMPL-final-report-docs-01.md`.

## Guardrails

- This is docs-only/foundation work.
- No runtime routes, env parsing, compose/deploy changes, tests or fixtures are in scope.
- Do not decide new product/security semantics; report unresolved drift to the orchestrator.
- Do not commit or push.

## Done Criteria

- Source docs and handoff are consistent enough for `TASK-FT018-02` to start.
- Production guard rules are explicit in the docs.
- The final report states whether the task is `PASS`, `FAIL` or blocked.
