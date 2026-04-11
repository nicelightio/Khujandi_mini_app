# TASK-FT010-20 Red Verification

## Semantic verdict
- semantic-pass

## Top substance risks
- No new substantive risk was confirmed inside the checked-in `TASK-FT010-20` scope.
- The previous real risk from `TASK-FT010-07` is materially closed: narrow seller-web status toggles no longer resend stale storefront metadata, and mounted runtime patch semantics now preserve omitted metadata fields.

## Hidden assumptions
- Shared storefront seller editing is still expected to use the broader shop update path intentionally; this task does not split the backend command surface into separate public API shapes.
- The mounted seller runtime assumes JSON-object request bodies on the checked-in happy path; this task hardens patch semantics, not the full request-shape validation model.

## Cross-boundary impact
- Positive: seller-web remains narrow and no longer interferes with canonical shared-storefront metadata writes.
- Positive: public `WORKING/NOT_WORKING` visibility behavior remains unchanged.
- Neutral: shared storefront seller edits continue to use the same broad update path, which matches current `FT-010` checked-in runtime design.

## Architectural concerns
- No architectural drift found relative to the `FT-010` intent.
- The solution stays minimal: frontend status-only intent plus backend patch-safe semantics, without introducing a second seller editor or a redundant command stack.

## State and data consistency
- State consistency improved: later status toggles no longer roll back newer `shop.name/description/media` values.
- Rename policy is not disturbed because status-only submits do not spend rename allowance and broader rename handling remains unchanged.

## Operational concerns
- No new retry/observability/mounting concern was introduced by this task within the checked-in runtime scope.
- Existing catalog write observability path remains intact because the same backend update path still emits the expected shop update artifact.

## Future maintenance cost
- Low. The change reduces hidden coupling between seller-web local state and shared-storefront metadata.
- Future explicit separation into distinct backend commands could still be considered later, but it is not required to close the current semantic risk.

## How this could still be wrong
- If later work expects the same seller route to reject unexpected mixed payloads rather than ignore omitted metadata safely, this task would not be sufficient by itself.
- If a future runtime path bypasses the mounted patch-safe parsing and reconstructs full shop payloads again, the stale-overwrite risk could reappear outside this checked-in path.

## Counterproposal or escalation path
- No escalation needed.
- Optional future hardening only if requested: introduce explicit request-shape validation or a dedicated status-only backend command for stronger API-level separation.
