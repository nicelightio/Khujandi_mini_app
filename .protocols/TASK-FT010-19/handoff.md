---
description: Handoff notes for TASK-FT010-19.
status: active
---
# TASK-FT010-19 Handoff

- Protected seller storefront reads now preserve canonical legacy products through an explicit `unpagedProducts` owner payload instead of silently dropping items that have `menuPageId = null` or point at a missing page.
- The shared `/shops/:shopId` storefront renders that legacy-product section on the same tree and keeps existing product edits canonical by submitting `menuPageId: null` when the product is still unpaged.
- Focused frontend API/route tests plus runtime integration coverage lock the regression so older checked-in shops no longer look empty to their owning seller.
