# Decision Log

## Pending teamlead decisions

1. Canonical server-side mock provider gate.
   - Proposed default: `PAYMENT_PROVIDER=mock` plus explicit non-production/runtime guard.
   - Rationale: payment trust must be selected by backend config, not by a client-only event or generic debug UI flag.

2. First iteration mock outcomes.
   - Proposed default: `success` is required for delivery/customer-status e2e; `failed` and `timeout/pending` are documented as planned/follow-up unless teamlead wants them in the first spec baseline.
   - Rationale: success unblocks end-to-end delivery flow; negative modes broaden checkout retry coverage.

3. Dedicated runbook.
   - Proposed default: add `.memory-bank/runbooks/e2e-mock-payment.md`.
   - Rationale: current runbooks mention checkout/payment verification but do not describe how to launch repo-local/e2e mock payment mode safely.

## Decisions confirmed

- Teamlead approved KISS defaults with "делай по KISS".
- Canonical server-side gate: `PAYMENT_PROVIDER=mock` plus explicit non-production/runtime guard.
- Optional frontend visibility gate: existing `DEBUG=true` / `__APP_DEBUG__`; it is not a server trust gate.
- First iteration required mode: `success`.
- `failed` and `timeout/pending` remain planned/follow-up unless explicitly scoped into implementation.
- Add dedicated Memory Bank runbook `.memory-bank/runbooks/e2e-mock-payment.md`.
