---
description: Guardrails and terminal states for unattended autonomous runs.
status: active
---
# Autonomy policy

## Default mode
- Prefer interactive mode unless the user explicitly requested unattended execution.

## Hard-stop categories
- security / compliance ambiguity
- external contracts or partner APIs with unknown behavior
- destructive data migrations
- secret reads / prod writes / deploys

## Allowed assumptions
- naming / wording / non-critical UX defaults
- low-risk implementation details that can be verified later

Non-blocking gaps must be written as explicit assumptions in `.protocols/AUTONOMOUS-RUN/decision-log.md`.

## Required gates
- latest `/review` verdict must be `APPROVE`
- mandatory `/verify` per TASK
- mandatory `/mb-sync`
- mandatory lint/link consistency before final success

## Failure budgets
- max_retries_per_task: 2
- max_consecutive_failures: 3
- max_open_blockers: 3

## Terminal states
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`
