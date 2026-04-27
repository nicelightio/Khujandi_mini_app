# TASK-FT013-01 Handoff

## Summary
- `FT-013` execution boundary is frozen docs-first.
- `catalog` remains the `FT-012` composition producer.
- `checkout-payment` is the consumer for composition route entry, server-side revalidation, auth/payment runtime usage and paid order creation.
- `FT-002` remains the owner of Telegram auth/session transport, provider trust, replay/idempotency and paid-only order semantics.
- No shared cart/payment business module is introduced.

## Follow-up task unlocked
- `TASK-FT013-02`

## Notes for next task
- Implement composition-required checkout route entry in `checkout-payment` presentation code.
- Direct `/checkout` or empty/missing composition must show controlled recovery to catalog/cart.
- Do not start payment or create orders from frontend-only preview data.
- Keep route handoff data non-sensitive and do not store session identifiers, raw `initData` or payment secrets in JS-readable persistence.
