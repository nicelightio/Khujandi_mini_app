---
description: Implementation report for TASK-FT003-02 shared localization scaffold.
status: active
---
# TASK-FT003-02 Implementation Report

## Summary
- Added a minimal shared localization scaffold for `FT-003`: language normalization helpers, centralized persistence orchestration, Telegram storage adapter types, shared language controller/state, and an app-level localization boundary.
- Kept storage/runtime access behind shared helpers so route and page components do not access `localStorage` or `Telegram.WebApp.*` directly.

## Touched code
- `frontend/src/shared/i18n/languages.ts`
- `frontend/src/shared/lib/language-persistence.ts`
- `frontend/src/shared/state/language.ts`
- `frontend/src/shared/telegram/webapp.ts`
- `frontend/src/app/localization-boundary.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/tests/shared/i18n/languages.spec.ts`
- `frontend/src/tests/shared/lib/language-persistence.spec.ts`
- `frontend/src/tests/app/localization-boundary.spec.tsx`
- `frontend/src/tests/slices/checkout-payment/app-router.spec.tsx`
- `jest.config.cjs`

## Verification
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/shared/i18n/languages.spec.ts frontend/src/tests/shared/lib/language-persistence.spec.ts frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/slices/checkout-payment/app-router.spec.tsx`
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/slices/catalog frontend/src/tests/slices/checkout-payment frontend/src/tests/shared frontend/src/tests/app`

## Notes
- The scaffold intentionally stops short of full copy localization, deterministic resolution edge cases beyond the centralized abstraction, and backend profile sync; those remain for follow-up tasks.
- The persistence layer explicitly distinguishes fallback `ru` from an explicit persisted `ru` selection via `hasPersistedLanguage`, so the overlay can remain mandatory only on true first run.
