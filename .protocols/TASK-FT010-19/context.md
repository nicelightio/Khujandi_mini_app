---
description: Execution context for TASK-FT010-19.
status: active
---
# TASK-FT010-19 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-19` card)
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- Backlog card with explicit touched files, hostile test target, verify target, and dependency on `TASK-FT010-18`.
- Feature/changelog docs explicitly describe the semantic gap: canonical seller storefront reads currently assume provisioned menu-page linkage and can hide legacy products without explicit `menuPageId`.

## Fallback use
- No separate implementation brief exists beyond the backlog/spec layer; implementation falls back to feature, contracts, requirements, and the checked-in `TASK-FT010-18` runtime behavior.

## Working assumptions
- Canonical seller storefront wiring from `TASK-FT010-18` remains the correct baseline and should be widened rather than replaced.
- The minimal correct fix is likely inside the backend seller read-model so frontend canonical wiring stays unchanged.
- Public browse semantics for `WORKING` shops and browse-safe menu-page linkage must remain intact while seller owner-visible reads tolerate legacy unpaged products.
