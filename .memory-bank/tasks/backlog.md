---
description: Backlog и execution plan (waves) для реализации.
status: active
---
# Backlog

> `/prd` rule: этот backlog не должен автоматически порождать TASK-IDs. Декомпозиция делается точечно через `/prd-to-tasks FT-<NNN>`.

## Current state

- Historical task cards вынесены из active backlog в archive layer, чтобы `backlog.md` оставался коротким canonical entrypoint для `/prd-to-tasks`, `/execute`, `/autopilot` и `/mb-sync`.
- Сейчас в active backlog нет execution-ready `TASK-*` card; при появлении новой feature decomposition новые активные task cards должны добавляться именно в этот файл.
- Existing implementation plans остаются в [.memory-bank/tasks/plans/index.md](plans/index.md): роутер по `IMPL-*` планам.

## Recommended feature order

1. `FT-001`, `FT-002`, `FT-003`, `FT-009`, `FT-010` для первой customer-facing и seller storefront волны.
2. `FT-004`, `FT-005`, `FT-006` для delivery operations.
3. `FT-007` для отдельного admin auth/security контура.
4. `FT-008` для post-delivery feedback loop и go-live hardening.

## Archive

- [.memory-bank/tasks/archive/backlog-full-pre-compaction-2026-04-19.md](archive/backlog-full-pre-compaction-2026-04-19.md): Полная historical копия исходного `backlog.md` до compaction; canonical archive source.
- [.memory-bank/tasks/archive/index.md](archive/index.md): Роутер по архивам historical task cards.
- [.memory-bank/tasks/archive/FT-001-to-FT-003.md](archive/FT-001-to-FT-003.md): Summary/navigation archive для `FT-001` ... `FT-003`.
- [.memory-bank/tasks/archive/FT-004-to-FT-006.md](archive/FT-004-to-FT-006.md): Summary/navigation archive для `FT-004` ... `FT-006`.
- [.memory-bank/tasks/archive/FT-007-to-FT-009.md](archive/FT-007-to-FT-009.md): Summary/navigation archive для `FT-007` ... `FT-009`.
- [.memory-bank/tasks/archive/FT-010-to-FT-011.md](archive/FT-010-to-FT-011.md): Summary/navigation archive для `FT-010` ... `FT-011`.

## Active task queue

- `FT-009` follow-up hardening wave is now reopened through active backlog cards for keyboard-safe bottom actions and centralized degradation policy.
- Current scoped follow-up intentionally excludes the broader `high-churn runtime propagation` refactor; that concern remains in the open bug record but is not part of the execution-ready wave below.

### TASK-FT011-09 — Allow multiple admin-provisioned shops per seller identity
- TASK-ID: `TASK-FT011-09`
- Status: `done`
- Wave: `W1`
- Feature: `FT-011`
- REQs: `REQ-028`
- Depends on: `none`
- Touched files: `backend/src/dev-runtime/catalog-runtime-prisma.ts`, optional `backend/src/dev-runtime/catalog-runtime-repository.ts`, `tests/slices/catalog/**/*`, and relevant `.memory-bank/*` docs
- Tests: mounted/runtime and integration coverage proving admin can provision multiple shops for one seller/Telegram identity when canonical shop names differ, while identical provisioning for the same `sellerId + shop name` still fails closed
- Verify: repo-local mounted runtime accepts `shop A` and `shop B` for the same seller via admin provisioning, seller still has no self-create shop surface, and repeated/conflicting provisioning remains controlled and atomic
- Docs: `tasks/backlog.md`, `contracts/catalog-seller-provisioning-and-visibility.md`, `features/FT-011-db-backed-catalog-runtime-baseline.md`, `requirements.md`, `testing/index.md`, `changelog.md` if implementation lands
- Source: post-change review finding on mounted `sellerShopBinding` uniqueness drift after `catalog-runtime` split
- Constraints: preserve canonical conflict key `sellerId + shop name`; do not widen scope into seller self-provisioning or broader catalog redesign

### TASK-FT009-07 — Add shell-owned keyboard-safe bottom action primitive
- TASK-ID: `TASK-FT009-07`
- Status: `in_progress`
- Wave: `W1`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`
- Depends on: `none`
- Touched files: `frontend/src/shared/ui/page-shell.tsx`, `frontend/src/shared/styles/webview-shell.css`, `frontend/src/slices/checkout-payment/components/**/*`, optional `frontend/src/slices/catalog/components/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, and relevant `.memory-bank/*` docs
- Tests: shell/component coverage for the new `bottomAction` primitive plus checkout route/page smoke proving customer-facing CTA rendering stays inside the shell-owned layout path
- Verify: keyboard-safe bottom CTA remains reachable through shell-owned safe-area-aware layout, and checkout no longer depends on page-local CTA placement for the critical action path
- Docs: `tasks/backlog.md`, `features/FT-009`, `testing/index.md`, `changelog.md` if implementation lands
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Constraints: keep scope on customer-facing Mini App surfaces; do not widen the task into a general contour-wide layout rewrite

### TASK-FT009-08 — Add minimal shell capability and degradation policy
- TASK-ID: `TASK-FT009-08`
- Status: `planned`
- Wave: `W2`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-07`
- Touched files: `frontend/src/app/app-shell.tsx`, `frontend/src/shared/telegram/webapp.ts`, `frontend/src/shared/state/**/*`, optional `frontend/src/shared/ui/**/*`, `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`, and relevant `.memory-bank/*` docs
- Tests: unit/contract coverage for capability derivation and shell fallback flags, plus smoke coverage proving the base customer-facing UI remains usable when optional enhancements are reduced or disabled
- Verify: shell owns one minimal degradation policy for weak-device/old-client runtime paths, and optional visual enhancements no longer rely on ad hoc feature-level decisions
- Docs: `tasks/backlog.md`, `features/FT-009`, `contracts/mini-app-runtime-contract.md`, `testing/index.md`, `changelog.md` if implementation lands
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Constraints: do not build a broad device-profiler subsystem; policy must stay minimal, shell-owned, and strictly outside domain logic

### TASK-FT009-09 — Verify shell bottom-action and degradation-policy closure
- TASK-ID: `TASK-FT009-09`
- Status: `planned`
- Wave: `W3`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-08`
- Touched files: `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, optional `.tasks/TASK-FT009-09/**/*`, `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/testing/index.md`, `.memory-bank/changelog.md`, `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Tests: rerun focused shell, shared-runtime, and checkout/customer-facing smoke suites plus any new contract tests introduced by `TASK-FT009-07` and `TASK-FT009-08`
- Verify: Android Telegram notes explicitly confirm reachable bottom CTA with keyboard open, predictable fallback/degradation behavior, and no obvious shell regression on the hardened customer-facing path
- Docs: `tasks/backlog.md`, `features/FT-009`, `testing/index.md`, `changelog.md`, `bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Scope note: this closure wave only covers the bottom-action and degradation-policy subset; the broader runtime-propagation refactor remains a separate follow-up concern until explicitly decomposed

## Conventions
Each task should include:
- goal
- expected touched files
- tests
- verification steps
- docs-first update

## Task state model
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Depends on: TASK-... | none`

## Task card template
### TASK-001 — short title
- TASK-ID: TASK-001
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: `src/...`, `tests/...`
- Tests: `npm test -- foo`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
