---
description: Execution context for TASK-FT016-06.
status: active
---
# TASK-FT016-06 Context

## Loaded Inputs

- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-05/verification.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/telegram-bot-contract.md`

## Gate

- Review verdict for this task: `APPROVE`.
- Upstream verification: `TASK-FT016-05` is `PASS`.
- Backlog start state changed from `ready` to `in_progress`.

## Boundary Check

- Owning capability slices: `delivery-assignment` for future manual targeted offer affordance; `delivery-tracking` for future status-control affordance and current operator read surface.
- Owning contour: `admin-web`.
- Touched layers: frontend `ui/app` and focused frontend tests only.
- Shared extraction: not justified. The placeholders/action-state labels are local to the admin assignment/operator page and do not define reusable business policy.

## Scope

- Add guarded or disabled admin-web action cells for targeted offer, status control confirmation, and bot chat redirect.
- User-facing labels must clearly state pending backend/runtime availability where relevant.
- Preserve current protected admin shell/routes and `TASK-FT016-04/05` read surface.

## Hard Stops

- No backend mutations.
- No actual bot deep-link execution.
- No message persistence.
- No offer/status/cancellation/refund behavior.
- No auto-offer toggle.
- No courier claim.
- Do not mark backlog `done`; verifier owns that transition.
