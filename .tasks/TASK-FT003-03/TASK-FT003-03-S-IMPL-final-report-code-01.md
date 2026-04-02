---
description: Implementation report for TASK-FT003-03 deterministic language resolution and storage fallback.
status: active
---
# TASK-FT003-03 Implementation Report

## Summary
- Tightened the shared localization runtime so invalid persisted values now resolve deterministically to `ru` without being mistaken for a valid explicit preference.
- Replaced the placeholder Telegram storage bridge with safe shared wrappers and made pre-auth persistence tolerant of unavailable higher-priority storage layers while preserving `DeviceStorage -> CloudStorage -> localStorage` order.

## Touched code
- `frontend/src/shared/i18n/languages.ts`
- `frontend/src/shared/lib/language-persistence.ts`
- `frontend/src/shared/telegram/webapp.ts`
- `frontend/src/tests/shared/i18n/languages.spec.ts`
- `frontend/src/tests/shared/lib/language-persistence.spec.ts`
- `frontend/src/tests/shared/telegram/webapp.spec.ts`

## Verification
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/shared/i18n/languages.spec.ts frontend/src/tests/shared/lib/language-persistence.spec.ts frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/app/localization-boundary.spec.tsx`
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/slices/catalog frontend/src/tests/slices/checkout-payment frontend/src/tests/shared frontend/src/tests/app`

## Notes
- Invalid persisted values intentionally short-circuit to fallback `ru` instead of reading lower-priority storage, so damaged state does not silently override deterministic runtime behavior.
- Write orchestration now degrades through lower-priority storage and only fails if every persistence layer rejects the write.
