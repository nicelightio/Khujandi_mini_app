---
description: Context and loaded sources for TASK-FT011-09.
status: active
---
# TASK-FT011-09 Context

## Task

- ID: `TASK-FT011-09`
- Title: `Allow multiple admin-provisioned shops per seller identity`

## Loaded normative inputs

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`

## Richer inputs found

- Active task card in `.memory-bank/tasks/backlog.md` with explicit touched files, tests, verify targets, docs, source, and constraints.
- `FT-011` acceptance criteria explicitly state that one seller identity may own multiple admin-provisioned shops when canonical shop names differ.
- `IMPL-FT-011` and contract/testing docs freeze the durable conflict boundary as `sellerId + shop name`, not `sellerId`-only or `telegramId`-only.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT011-09`.
- Used classic fallback: task card -> feature -> requirements -> contracts/testing/architecture -> current code and test surface.

## Task invariants

- Admin provisioning must allow multiple shops for one seller/Telegram identity when shop names differ.
- Canonical conflict semantics remain keyed by `sellerId + shop name` and must still fail closed with controlled `409` behavior for identical or conflicting retries.
- Scope must not expand into seller self-provisioning or broader catalog redesign.
- Mounted repo-local runtime behavior must match the canonical Prisma-backed persistence contract.
