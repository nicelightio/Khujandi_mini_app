---
description: Context for TASK-FT016-19 documentation and Memory Bank sync.
status: active
---
# TASK-FT016-19 Context

## Scope

- Task: `TASK-FT016-19 - Documentation and Memory Bank sync`.
- Mode: docs-only worker after `/autopilot` review gate `APPROVE`.
- Source evidence: `.protocols/TASK-FT016-18/verification.md` records `PASS` for the repo-local v2 operator delivery flow.

## Required Reading

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-18/verification.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/tasks/plans/index.md`
- `.memory-bank/changelog.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`

## Micro-Check

- Owning capability slices: `delivery-assignment` and `delivery-tracking`.
- Consumed slices/contours: `checkout-payment`, `admin-access`, `order-cancellation`, `telegram-bot`, `admin-web`, `mini-app`.
- Owning contour for this task: docs / Memory Bank.
- Touched layers: documentation only.
- Shared extraction: not justified; no code or shared behavior changes are allowed.

## Evidence Baseline

- `TASK-FT016-18` verified paid order `CREATED`, operator unassigned visibility, manual offer, courier claim, courier lifecycle `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator/admin `DELIVERED -> COMPLETED`, polling visibility, disabled normal legacy assignment, and old v1 active order readability.
- Historical failures remain part of the record and must not be erased:
  - `TASK-FT016-07` repaired by `TASK-FT016-07-FIX`.
  - `TASK-FT016-13` repaired by `TASK-FT016-13-FIX`.
  - `TASK-FT016-15` repaired by `TASK-FT016-15-FIX`.
  - `TASK-FT016-17` repaired by `TASK-FT016-17-FIX`.

## Residual Risks

- Real Android Telegram smoke for the v2 operator/courier/customer flow was not run in this task; it remains advisory pre-release evidence unless separately requested.
- This task does not verify production deploy, real Telegram bot delivery, or real chat execution.
- The worktree contains broad pre-existing uncommitted FT-016 implementation changes; this task must not modify or revert them.
