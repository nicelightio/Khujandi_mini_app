---
description: Decision log for FT-013 decomposition.
status: active
---
# FT-013 Decision Log

## 2026-04-25

- Decision: keep `checkout-payment` as the owner of mounted checkout orchestration, Telegram auth/session transport, payment finalization and order creation semantics.
- Rationale: `FT-013` closes the real customer workflow around existing `FT-002` boundaries; moving trust/payment logic into `catalog`, shell, or shared would violate the feature spec.
- Decision: represent the `catalog -> checkout-payment` handoff only through the existing customer order composition contract.
- Rationale: `FT-012` produces customer intent; `FT-013` must revalidate that intent before payment and must not trust preview totals or snapshots.
- Decision: decompose final closure into a dedicated verification/docs task.
- Rationale: `REQ-023` requires Telegram-sensitive evidence beyond browser-only smoke for customer-facing checkout runtime.
