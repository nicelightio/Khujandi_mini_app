---
description: Adversarial semantic verification for TASK-FT013-05.
status: active
---
# TASK-FT013-05 Red Verification

## Semantic Verdict
- `semantic-pass`

## Hostile Hypotheses Checked
- The runtime might create an order from a client-only checkout submit rather than a trusted payment confirmation.
- The runtime might bypass server-side catalog revalidation and persist stale composition totals.
- The change might leak catalog ownership or delivery lifecycle ownership into `checkout-payment`.
- The response metadata might imply delivery tracking semantics that `FT-013` does not own.

## Findings
- The mounted route calls existing `checkout-payment` `checkoutOrder`, which still enforces provider/source checks, configured verification token, `PAID` status and composition revalidation before persistence.
- Catalog facts are read through the `CheckoutPaymentCatalogCompositionReader` seam; no shared cart/payment business module was introduced.
- Created orders remain initial `CREATED`; assignment/tracking transitions are untouched.
- Duplicate submit with the same authenticated user and composition reuses the deterministic local provider transaction identity and does not create a second order in runtime coverage.

## Hidden Assumptions
- The checked-in dev runtime uses a repo-local provider status confirmation to model trusted payment success. This is acceptable for current repo-local MVP verification, but provider-specific production callback/status transport remains a later hardening/deploy concern.
- Existing order persistence fields store shop/customer/amount/payment snapshots; there is still no separate order-item persistence model in this task scope.

## How This Could Still Be Wrong
- If the local provider emulation were copied into a production provider contour without real provider verification, it would violate `REQ-021`.
- If downstream `FT-014` requires event-backed cursor semantics instead of the returned string `revision` surrogate, it should refine that contract in its own task.

## Counterproposal / Escalation Path
- Keep `TASK-FT013-06` as the next hardening step for retry/failure and provider callback/idempotency edges.
- Do not promote broader `REQ-032` closure until final `TASK-FT013-07` evidence covers the whole catalog/cart -> checkout -> paid order -> status entry flow.
