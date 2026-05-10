---
description: Decision log for FT-017 guarded e2e mock payment mode.
status: active
---
# FT-017 Decision Log

## 2026-05-11

- Decision: use KISS option 1 and treat the current hard-coded repo-local local-runtime-provider as an old implicit mock.
- Rationale: the project already has a local paid checkout path for repo-local closure, but the trust boundary must be explicit and auditable before it is used as e2e infrastructure.

- Decision: future implementation must replace/gate the implicit path through `PAYMENT_PROVIDER=mock`.
- Rationale: provider trust belongs server-side in `checkout-payment`; frontend debug state must not be able to manufacture trusted payment confirmation.

- Decision: the non-production guard defaults to `NODE_ENV !== "production"`, and production must reject/refuse mock provider usage.
- Rationale: mock payment is verification/runtime infrastructure only and must never become a production payment provider.

- Decision: the first baseline supports only mock `success/paid`.
- Rationale: this is enough to unblock customer checkout -> paid order -> delivery/status e2e; failed, timeout and pending mock outcomes remain follow-up scope.

- Decision: visible affordance belongs only to the checkout presentation after backend guard implementation.
- Rationale: `catalog` owns composition, not payment trust controls; the affordance must not appear before valid checkout handoff and server-side revalidation.
