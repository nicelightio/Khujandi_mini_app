# TASK-FT010-17 Red Verification

## Semantic verdict
- `semantic-pass`

## Top substance risks
- No substantive semantic break found in the checked-in task scope.

## Hostile hypothesis list
- The task might have only replaced one local fallback while leaving other admin contour paths semantically over-broad.
- The task might accidentally remove an intended canonical admin entrypoint behavior such as `/admin -> assignment`.
- Focused router tests might prove only surface text changes while hidden auth or contour semantics still regress.

## What was checked
- `.memory-bank/tasks/backlog.md`: task intent is to remove the implicit admin fallback for unknown `/admin/*` paths.
- `.protocols/TASK-FT010-17/{context,plan,progress,verification}.md`: execution and verification basis.
- `frontend/src/admin/app/router.tsx`: unknown admin paths now resolve to `null` and render explicit `Admin page not found` under `AdminShell`.
- `frontend/src/tests/admin/admin-router.spec.tsx`: hostile admin-route smoke now freezes `resolveAdminRoute("/admin/missing") === null` and asserts no login/assignment fallback.
- `frontend/src/tests/app/root-router.spec.tsx`: root contour still selects `admin-web` for `/admin/missing` and renders explicit not-found feedback.
- Re-ran repo-local verification commands for Jest and ESLint.

## Cross-boundary impact
- The task improves semantic consistency across adjacent operator-facing contours: unsupported `/seller/*` and `/admin/*` paths now both fail explicitly instead of silently mapping to real working screens.
- No evidence was found that this change harms customer storefront routing or seller contour separation.

## Architectural concerns
- No architectural concern found. The change stays minimal, keeps contour ownership unchanged, and avoids introducing a new routing abstraction.

## State/data consistency concerns
- None. The change is presentation-routing only and does not alter persistence, session storage, or domain state transitions.

## Operational concerns
- Operationally this is safer than the previous behavior because mistyped admin URLs now surface as explicit misses instead of masking broken links or stale bookmarks behind the assignment screen.

## Future maintenance cost
- Low. The change reduces asymmetry between seller/admin contour semantics and lowers the chance of future fallback drift.

## Hidden assumptions
- This pass did not find any normative source that requires bare `/admin` or unknown `/admin/*` paths to canonicalize into assignment or login.
- If product later wants a dedicated canonical admin landing route, that should be introduced explicitly as a real route rather than via an implicit unknown-path fallback.

## How this could still be wrong
- If operators are already relying on `/admin` as a de facto bookmark to reach the assignment page, the current explicit-miss behavior could be stricter than their informal expectation. No such requirement or contract is documented in the current spec/task surface.

## Counterproposal / escalation path
- No follow-up required from the current normative/task basis.
- If human operators want a canonical admin landing entrypoint later, open a separate task to add an explicit `/admin` route or redirect policy.

## Evidence
- `frontend/src/admin/app/router.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `frontend/src/tests/app/root-router.spec.tsx`
- `.protocols/TASK-FT010-17/verification.md`
- `.tasks/TASK-FT010-17/TASK-FT010-17-S-IMPL-final-report-code-01.md`
