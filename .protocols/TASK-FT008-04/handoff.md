---
description: Хэнд-офф по TASK-FT008-04.
status: done
---
# TASK-FT008-04 Handoff

## Done
- Added `submitReview` command path in `reviews-feedback` service/controller.
- Validated completed-order gate, actor/direction ownership, required `rating/reasonCode`, and optional comment normalization.
- Added duplicate-safe lookup/fallback in Prisma repository plus repo-local unit/integration coverage.

## Next tasks
- `TASK-FT008-05`: publish canonical `review.negative` and fan out low-rating alerts to active admins.
- `TASK-FT008-06`: wire bot-guided client/courier review steps to the new backend submit path.

## Guardrails
- Keep `review.negative` semantics inside `reviews-feedback`; do not move them into Telegram transport.
- Duplicate replay must remain side-effect free: no second review row and no second low-rating event.
- Admin recipient resolution for alerts still belongs to the later runtime task and must not pull `FT-007` auth/session scope into this slice.

## Verification snapshot
- `npm run test:reviews-feedback` -> PASS
- `npm run lint` -> PASS
- `npx tsc --noEmit -p tsconfig.jest.json` -> PASS
