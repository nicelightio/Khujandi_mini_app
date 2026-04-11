# TASK-FT010-04 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- Seller capability resolution now uses the Telegram auth/session semantics in principle, but the checked-in seller-protected runtime path still relies on a route-local in-memory Mini App auth mount inside `backend/src/dev-runtime/dev-api-server.ts` rather than reusing a persistent checked-in backend HTTP boundary wired to the real `User` / `MiniAppSession` storage.
- This means the task materially improves correctness versus client flags and `shop.sellerId`-only reads, but it can still create false confidence that seller access is operationally closed when the verified path is only the repo-local dev shell and not the durable runtime path future UI work will ultimately depend on.

## Hidden assumptions
- Assumes the ad hoc `dev-runtime` Mini App auth mount will stay behaviorally aligned with the real checkout/auth session boundary as `FT-002` evolves.
- Assumes restart-local in-memory session state is acceptable evidence for this task even though the product/session contracts describe a durable Telegram-linked session family.

## Cross-boundary impact
- Crosses `catalog` and `checkout-payment` boundaries by borrowing Telegram auth logic without mounting the real checked-in session persistence/runtime path.
- Raises drift risk between seller access verification and the eventual customer/seller Mini App auth runtime.

## Architectural concerns
- `catalog` ownership is preserved, but `dev-runtime` now carries a second route-local session resolution path instead of delegating to one mounted Mini App auth boundary.
- This adds future maintenance cost because auth/session semantics can diverge in two places: the real checkout auth implementation and the seller runtime shell.

## State / data consistency concerns
- The semantic seller decision still correctly checks `SellerShopBinding` plus canonical `shop.sellerId` alignment.
- The remaining concern is runtime state durability/alignment: seller verification currently proves correctness against in-memory session records, not against the persisted runtime store used by the actual auth slice.

## Operational concerns
- A restart of the repo-local server drops Mini App sessions immediately in the red-verified path.
- Future frontend wiring could accidentally integrate against assumptions that only hold in the in-memory dev-runtime shell.

## Future maintenance cost
- Every change to Telegram auth/session policy now has to be kept aligned across the real auth slice and the `dev-runtime` seller access mount.

## How this could still be wrong
- The implementation may pass current AC/tests yet still fail the intended "shared identity/session family" goal if later runtime wiring does not reuse the same persistent HTTP auth boundary.
- Seller access could regress semantically if one path evolves refresh/session semantics while the route-local dev-runtime clone does not.

## Counterproposal / escalation path
- Add a follow-up task to mount seller access on the real checked-in Mini App auth/session runtime boundary backed by persistent `User` / `MiniAppSession` storage, so `catalog` seller reads consume the same runtime/session family rather than a dev-runtime-local clone.
