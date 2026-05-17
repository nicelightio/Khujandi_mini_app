---
task: TASK-TSC-REPAIR
stage: stale-test-session-repair
role: subagent-implementer
date: 2026-05-14
---

# TASK-TSC-REPAIR Stale Test Session Repair Report

## Result

PASS.

Updated the stale checkout-payment runtime test-session assertion to verify the current primitive-only `ErrorDetails` behavior for rejected arbitrary identity fields.

## Architectural Micro-Check

- Owning slice/capability: `checkout-payment` session primitive consumed by `FT-018` staging test auth harness.
- Owning contour: runtime/test harness for `mini-app` fixed-persona sessions.
- Touched layer: test only.
- Shared extraction: not justified; no shared `ErrorDetails` widening was made.

## Files Inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-TSC-REPAIR/plan.md`
- `.tasks/TASK-TSC-REPAIR/TASK-TSC-REPAIR-final-verification-report.md`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`

## Files Changed

- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `.tasks/TASK-TSC-REPAIR/TASK-TSC-REPAIR-stale-test-session-repair-report.md`

## Drift Fixed

The test previously expected:

```ts
rejectedFields: ["telegramId", "role", "password"]
```

It now expects the spec-layer primitive-only details emitted by the runtime:

```ts
rejectedFields: "telegramId,role,password",
rejectedFieldCount: 3
```

Runtime behavior was not changed.

## Checks Run

```bash
npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts --runInBand
```

PASS: 1 suite / 7 tests.

```bash
npx tsc --noEmit -p tsconfig.jest.json
```

PASS.

```bash
git diff --check
```

PASS.

## Blockers/Risks

- No blockers.
- Existing unrelated working-tree changes from prior TASK-TSC-REPAIR waves remain present and were not modified beyond the scoped stale test file.

## Recommendation

Accept this stale-test repair and rerun any broader Jest/root closure from the orchestrator context if needed.
