---
description: Context for TASK-FT015-FIX showcase curation repair.
status: active
---
# TASK-FT015-FIX Context

- Owning slice: `catalog`.
- Contours: `mini-app` public showcase/storefront read; admin-session curation affordances from the existing admin-web auth boundary.
- Touched layers: presentation/frontend interaction, dev-runtime HTTP preflight, focused tests.
- Shared justification: no new shared extraction; fixes remain local to catalog UI/runtime surfaces.
- Normative inputs: `.memory-bank/features/FT-015-start-showcase-and-curation.md`, `.memory-bank/contracts/catalog-start-showcase-contract.md`, `.memory-bank/testing/index.md`, `doc/ARCHITECTURE.md`.

## Scope

Close necessary review findings with KISS:
- stable positive admin curation action from storefront long-press/context menu;
- awaited curation mutations with controlled feedback and state refresh/reconcile;
- browser preflight support for `DELETE` curation endpoints.

Out of this repair scope:
- DB-level atomic favorite-shop cap;
- extra hostile-origin duplicate tests;
- new audit/event architecture for showcase curation;
- full browser/Telegram smoke harness.
