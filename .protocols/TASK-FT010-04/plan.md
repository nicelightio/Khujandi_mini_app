# TASK-FT010-04 Plan

## Richer inputs
- Backlog card provides explicit constraints, verification targets, and a red-verify focus.
- FT-010 plus the seller access / provisioning / public API contracts define the acceptance and failure posture.

## Plan
1. Extend `catalog` read-side types/repository methods for Telegram-linked seller-owned shop resolution without trusting `shop.sellerId` alone.
2. Add service/controller methods for seller-owned reads and controlled `401/403` failure posture.
3. Mount repo-local Mini App auth/session and seller-protected runtime routes in `dev-runtime` using the existing Telegram session family semantics.
4. Add targeted unit/integration/runtime tests for authenticated seller, authenticated non-seller/non-owner, anonymous access, and `NOT_WORKING` owner visibility vs public hiding.
5. Run targeted checks, then update protocol/Memory Bank state.
