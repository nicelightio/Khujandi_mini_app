---
description: План декомпозиции FT-010 в implementation plan и execution-ready backlog.
status: active
---
# FT-010 Decomposition Plan

## Goal

- Разложить `FT-010` на атомарные implementation tasks для shared seller storefront edit mode, admin-provisioned skeleton shops, Telegram-linked seller access reuse и узкой `/seller/*` store-admin поверхности со status toggle `WORKING/NOT_WORKING`.

## Inputs used

- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../../.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md): owning feature spec, acceptance criteria и verification targets.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и seller/customer outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-024`, `REQ-025`, `REQ-026` и RTM.
- [.memory-bank/contracts/catalog-public-api.md](../../.memory-bank/contracts/catalog-public-api.md): public browse visibility boundary.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../../.memory-bank/contracts/seller-catalog-write-policy.md): ownership, rename policy и no-delete baseline.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../../.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md): admin provisioning, seller binding и `WORKING/NOT_WORKING` rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../../.memory-bank/contracts/catalog-seller-access-and-session.md): shared session family и `/seller/*` access rules.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../../.memory-bank/contracts/telegram-mini-app-auth-contract.md): reused Telegram auth bootstrap.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../.memory-bank/contracts/mini-app-runtime-contract.md): seller mode activates only from server-validated access state.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): contour boundaries and owner-slice rules.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): status/media/menu page/snapshot boundaries.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline and anti-cheat rules for seller contours.

## Current repository state

- `backend/prisma/schema.prisma` все еще моделирует `catalog` через `Shop`/`Product` + `isDeleted` и не содержит menu pages, explicit shop status, media/description fields или provisioning artifacts.
- `backend/src/slices/catalog/**/*` реализует только public browse, seller rename и product create/update; seller capability resolution, skeleton provisioning и status-based visibility пока отсутствуют.
- `backend/src/dev-runtime/dev-api-server.ts` монтирует только public demo catalog reads и admin auth runtime.
- `frontend/src/app/root-router.tsx` различает только customer и `/admin/*` contours; seller contour не смонтирован.
- `frontend/src/slices/catalog/components/catalog-page.tsx` является browse-only storefront без edit mode, menu pages или seller-specific controls.
- В репозитории пока нет `frontend/src/seller/**/*` или seller-specific frontend harness.

## Decomposition strategy

1. W1: подготовить backend schema/test foundation и frontend contour scaffolds для shared storefront, `/seller/*` и admin provisioning без размывания owner slice `catalog`.
2. W2: доставить runtime behavior по трем осям: admin provisioning + seller binding, seller capability/visibility resolution, seller edit/write surfaces на shared storefront и в `/seller/*`.
3. W3: закрыть feature repo-local verify, explicit no-delete/public-visibility evidence и финальным docs/RTM sync.

## Constraints

- `FT-010` не создает новый business slice; все seller/admin presentation surfaces остаются delivery-формами одного owner slice `catalog`.
- Shared storefront edit mode MUST использовать тот же route family и тот же component tree, что и customer browse.
- `/seller/*` MUST остаться narrow store-admin contour, а не второй storefront implementation.
- Seller access MUST переиспользовать Telegram-linked session family без отдельного seller password baseline.
- Legacy soft-delete browse logic должна уступить explicit `WORKING/NOT_WORKING` visibility policy.
- Final verify MUST отдельно доказать отсутствие delete UI и корректную owner-only visibility для `NOT_WORKING`.

## Expected outputs

- `.protocols/FT-010/plan.md`
- `.protocols/FT-010/decision-log.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- backlog section с `TASK-FT010-01` ... `TASK-FT010-08`
- execution-ready W1 tasks для backend catalog expansion и frontend contour scaffolding
