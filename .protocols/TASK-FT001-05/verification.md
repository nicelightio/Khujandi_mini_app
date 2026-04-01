---
description: Verification record for TASK-FT001-05.
status: active
---
# TASK-FT001-05 Verification

## Basis

- Task card verification targets from `.memory-bank/tasks/backlog.md`
- `FT-001` acceptance criteria
- `seller-catalog-write-policy` contract

## Planned checks

- Seller can update only own shop.
- Non-owner shop write is rejected without partial mutation.
- First rename does not set manual paid marker.
- Repeated rename sets manual paid marker.
- No task logic attempts cross-slice snapshot mutation.

## Evidence

- Command: `npx --yes -p typescript tsc --noEmit --allowImportingTsExtensions --moduleResolution node16 --module node16 --target es2022 backend/src/shared/db/prisma-client.ts backend/src/shared/errors/app-error.ts backend/src/slices/catalog/domain/catalog.types.ts backend/src/slices/catalog/application/catalog.service.ts backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts backend/src/slices/catalog/presentation/catalog.controller.ts backend/src/slices/catalog/presentation/catalog.module.ts`
  - Result: PASS
- Command: `npx --yes -p tsx tsx --eval "import { createCatalogModule } from './backend/src/slices/catalog/presentation/catalog.module.ts'; import { AppError } from './backend/src/shared/errors/app-error.ts'; (async () => { ... })().catch(...)"`
  - Result: PASS
  - Evidence: first rename keeps `requiresManualRenameReview: false`, second rename sets it to `true`, and foreign seller write throws `SHOP_FORBIDDEN`.
- Command: `npm run test:catalog:unit`
  - Result: PASS
- Command: `npm run test:catalog:integration`
  - Result: PASS

## Verdict

- PASS
