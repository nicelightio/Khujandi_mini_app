---
description: Implementation plan for TASK-FT016-08.
status: active
---
# TASK-FT016-08 Plan

## Steps

1. Mark backlog task `in_progress`.
2. Inspect existing Telegram bot harness patterns and delivery-assignment service boundary.
3. Add a narrow courier availability Telegram harness that builds menu text/buttons and parses callback payloads into service intents.
4. Add focused unit coverage for menu labels, callback payloads, parser rejection, and service-boundary invocation without Prisma writes.
5. Run `npm run test:delivery-assignment` and `git diff --check`.
6. Write implementation report to `.tasks/TASK-FT016-08/TASK-FT016-08-S-IMPL-final-report-code-01.md`.

## Non-Goals

- No webhook/update server.
- No offer creation, claim, status progression, timeout, order history/audit/event side effects, admin UI, or bot-local persistence.
