---
description: План verification/docs-only выполнения TASK-FT016-18.
status: active
---
# TASK-FT016-18 Plan

## Steps

1. Read required operating, architecture, backlog, run, repaired dependency and normative spec context.
2. Record task context, plan and progress without touching implementation files.
3. Run existing relevant verification commands:
   - `npm run test:delivery-assignment -- --runInBand`
   - `npm run test:delivery-tracking -- --runInBand`
   - focused admin assignment frontend tests
   - `npm run test:order-tracking:frontend -- --runInBand`
   - `npm run lint`
   - `npm run build:frontend`
4. Run final hygiene:
   - `git diff --check`
   - changed markdown local link validation.
5. If all checks pass, mark TASK-FT016-18 as `PASS`/`done` and update allowed docs.
6. If any check fails, mark TASK-FT016-18 as `FAIL`, record exact evidence and propose a separate narrow repair task without patching code/tests/fixtures.

## Guardrails

- Do not edit production code, tests, fixtures, schema or implementation evidence.
- Do not repair failing checks in this task.
- Do not commit or push.
