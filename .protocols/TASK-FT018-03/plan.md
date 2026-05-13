---
description: Implementation plan for TASK-FT018-03 local staging profile plus guarded reset and seed endpoints.
status: active
---
# TASK-FT018-03 Plan

## Steps

1. Re-read `TASK-FT018-02` verification outcome and FT-018 reset/seed contract before touching files.
2. Inspect current dev-runtime state locations, in-memory stores and local DB path handling.
3. Wire a local staging profile that uses explicit non-production env and isolated `.runtime/staging/*` paths.
4. Add guarded `POST /api/v1/test/reset`:
   - only in `E2E_TEST_MODE=TRUE` and non-production staging/test mode;
   - requiring `X-E2E-Test-Token`;
   - deleting/reinitializing only staging-owned state.
5. Add guarded `POST /api/v1/test/seed` with deterministic scenario keys from the contract/runbook:
   - `baseline_catalog`
   - `checkout_happy`
   - `seller_owned_shop`
   - `operator_orders`
   - `delivery_happy_path`
6. Add focused tests for guard behavior, token behavior, deterministic seed results and staging-state isolation.
7. Update runbook only if implementation command shape differs from the current documented shape.
8. Run checks:
   - focused runtime reset/seed tests
   - local staging smoke when feasible
   - `git diff --check`
9. Write `.tasks/TASK-FT018-03/TASK-FT018-03-S-IMPL-final-report-code-01.md`.

## Guardrails

- Do not perform destructive Docker/system cleanup.
- Do not read, print or persist `E2E_TEST_TOKEN` into docs/logs.
- Do not use production user identities or production DB/volume paths.
- Keep seeds small and deterministic; no broad fixture framework unless already present.
- Do not commit or push.

## Done Criteria

- Reset/seed endpoints are unavailable outside enabled staging/test mode.
- Staging reset is constrained to staging-owned state.
- Seed scenarios provide deterministic baseline data for `TASK-FT018-04`.
