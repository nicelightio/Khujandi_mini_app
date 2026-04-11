# TASK-FT010-03 Handoff

## Scope
- Backend `catalog` provisioning command and skeleton bootstrap.
- Repo-local dev runtime mounting for the command.
- Task-local tests and docs sync.

## Open items
- Seller capability/session resolution remains with `TASK-FT010-04`.
- Frontend admin provisioning UI remains with `TASK-FT010-07`.

## Delivered outputs
- `CatalogService.provisionSellerShop()` now owns the admin provisioning orchestration and default starter blueprint use.
- `PrismaCatalogRepository.provisionSellerShop()` now persists shop, binding, menu pages, and products inside one transaction.
- `startDevApiServer()` now mounts `POST /api/v1/admin/catalog/shops/provision` for repo-local runtime coverage and later UI wiring.
