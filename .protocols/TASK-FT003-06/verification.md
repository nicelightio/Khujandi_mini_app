---
description: Verification record for TASK-FT003-06.
status: active
---
# TASK-FT003-06 Verification

## Basis
- `REQ-003`, `REQ-022`, `REQ-023`
- `.memory-bank/features/FT-003-language-selection-and-localization.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `.memory-bank/testing/index.md`

## Commands
- `npx tsc --noEmit -p tsconfig.jest.json`
- `npx jest --runInBand --config jest.config.cjs frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/shared/i18n/languages.spec.ts frontend/src/tests/shared/lib/language-persistence.spec.ts frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/language.spec.ts frontend/src/tests/slices/catalog/catalog-api.spec.ts frontend/src/tests/slices/catalog/catalog-view-model.spec.ts frontend/src/tests/slices/catalog/catalog-page.spec.tsx frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/checkout-payment/app-router.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-view-model.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts`

## Verification steps
- Audited the existing frontend/shared/backend localization-related suites against `FT-003` acceptance criteria and the Telegram verification runbook.
- Added direct unit coverage for `createLanguageController` so overlay visibility is verified against resolved persistence state instead of only indirectly through route smoke.
- Re-ran repo-local typecheck and the combined frontend/backend localization suites in-band.
- Re-ran the same gates again during `/verify TASK-FT003-06` to confirm the recorded evidence remains reproducible without drift.
- Compared the resulting evidence with RTM ownership: `REQ-003` is fully supported by repo-local evidence, while `REQ-022` and `REQ-023` still include shared shell/client-matrix work that remains with `FT-009`.

## AC / REQ evaluation
- Mandatory first-run language selection and `ru/en/tj` baseline:
- PASS. `frontend/src/tests/app/localization-boundary.spec.tsx`, `frontend/src/tests/shared/state/language.spec.ts`, and route/page/view-model smoke confirm the overlay gates customer-facing routes until a valid explicit choice exists and the selected language flows into catalog/checkout UI.
- Persistence fallback and invalid persisted-state handling:
- PASS. `frontend/src/tests/shared/lib/language-persistence.spec.ts`, `frontend/src/tests/shared/i18n/languages.spec.ts`, and `frontend/src/tests/shared/telegram/webapp.spec.ts` cover `DeviceStorage -> CloudStorage -> localStorage`, graceful degradation, and fallback-only `ru` for unsupported values.
- Post-auth language sync into backend profile state:
- PASS. `tests/slices/checkout-payment/checkout-payment.unit.spec.ts` and `tests/slices/checkout-payment/checkout-payment.integration.spec.ts` verify supported-language validation and persisted explicit language updates after auth.
- Telegram-sensitive verification boundary:
- PASS with scoped limitation. Repo-local adapter/runtime evidence is complete for `FT-003` ownership, but broader shell persistence and real Telegram client-matrix closure still remain shared with `FT-009`, so `REQ-022` and `REQ-023` stay planned in RTM.

## Evidence
- `frontend/src/tests/shared/state/language.spec.ts`: direct controller coverage for unresolved fallback, explicit persisted default language, and selection persistence.
- `frontend/src/tests/app/localization-boundary.spec.tsx`: overlay gating and route release after hydration.
- `frontend/src/tests/shared/i18n/languages.spec.ts`: supported-language parsing and fallback-to-`ru` behavior.
- `frontend/src/tests/shared/lib/language-persistence.spec.ts`: deterministic storage fallback read/write behavior.
- `frontend/src/tests/shared/telegram/webapp.spec.ts`: Telegram storage wrapper/runtime bridge contract coverage.
- `frontend/src/tests/slices/catalog/*` and `frontend/src/tests/slices/checkout-payment/*`: localized customer-facing route/page/view-model/API smoke.
- `tests/slices/checkout-payment/*.spec.ts`: backend language sync validation and integration through the checkout/auth contour.
- Combined verification passed with `16` suites and `78` tests.
- Independent `/verify` rerun also passed with `16` suites and `78` tests.
- No dedicated repo-local `lint` script exists in `package.json`.

## Verdict
- VERDICT: PASS
- `PASS`
