---
description: Handoff summary for TASK-FT011-09.
status: active
---
# TASK-FT011-09 Handoff

## Status

- Complete.

## Notes for next reader

- Normative contract is already clear: multi-shop-per-seller is allowed for admin provisioning when the shop name differs.
- The landed fix surface stayed narrow and centered on mounted runtime parity plus regression coverage.
- If later drift reappears, inspect `backend/src/dev-runtime/catalog-runtime-prisma.ts` first; the canonical repository/schema path already allows repeated `telegramId` and `sellerId` bindings across different shops.
