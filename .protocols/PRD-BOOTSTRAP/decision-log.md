---
description: Decision log and open questions for PRD bootstrap.
status: active
---
# PRD Bootstrap Decision Log

## Decisions
- 2026-03-30: Started `/prd` flow based on `.memory-bank/commands/prd.md`.
- 2026-03-30: Repository does not contain a `prd.md` file; PRD text is required from the user before the flow can continue.
- 2026-03-30: User clarified that the source documentation, including PRD, lives in `doc/`; `doc/PRD.md` is the primary product source, with `doc/ARCHITECTURE.md` as the architectural tie-breaker.
- 2026-03-30: Supporting normative inputs for PRD bootstrap in this run are `doc/ARCHITECTURE.md`, `doc/API_GUIDELINES.md`, `doc/TESTING_STRATEGY.md`, `doc/PROJECT_SPECIFICATION.md`, and `doc/GLOSSARY.md`.
- 2026-03-30: Canonical MVP capability slices are stable across the reviewed sources: `catalog`, `checkout-payment`, `delivery-assignment`, `delivery-tracking`, `order-cancellation`, `reviews-feedback`, `admin-access`.
- 2026-03-30: Memory Bank currently contains draft placeholders for `product.md`, `requirements.md`, `glossary.md`, and `invariants.md`; epics/features docs have not been generated yet.
- 2026-03-30: Seller-side CRUD remains inside the `catalog` MVP scope as a supporting concern, not a separate capability slice.
- 2026-03-30: Courier feedback about the client should be modeled through Telegram bot interaction in MVP.
- 2026-03-30: Telegram notification recipients should default to the minimum actor-targeted audience instead of broad admin broadcast, unless a specific case requires wider delivery.
- 2026-03-30: Multilingual support (`ru`, `en`, `tj`) is part of the product MVP scope and should be represented in requirements/RTM.
- 2026-03-30: `doc/BRIEF_EXT.md` is treated as a key secondary baseline source for frontend UX, event payload shape, transport details, and infrastructure notes where it does not conflict with `doc/PRD.md`.
- 2026-03-30: Negative review alerts are modeled as an explicit exception to the default actor-targeted notification policy: `review.negative` fans out to active admins.
- 2026-03-30: Final `/prd` pass added minimal normative layer for `architecture`, `guides`, `contracts`, `states`, `runbooks`, and real ADR docs to eliminate placeholder-only spec gaps.
- 2026-03-30: `mb-review` converged to `APPROVE` for architecture/scope/security/MBB; only backlog execution-readiness remains pending by design because `/prd` must not auto-generate TASK cards.

## Open questions
- No blocking open questions remain for the current PRD -> Memory Bank bootstrap pass.

## Notes
- PRD and supporting source docs were found under `doc/` and reviewed for the first questioning round.
- Current run mode: `interactive`.
