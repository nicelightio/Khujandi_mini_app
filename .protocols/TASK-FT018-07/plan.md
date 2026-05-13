---
description: План выполнения TASK-FT018-07 security review and final verification/evidence closure.
status: active
---
# TASK-FT018-07 Plan

## Steps

1. Re-read FT-018 feature, contract, runbook, testing policy and `TASK-FT018-02..06` verification notes.
2. Build an evidence matrix against `REQ-037` and FT-018 acceptance criteria:
   - local staging profile.
   - server staging profile.
   - guarded mock payment.
   - fixed-persona test sessions.
   - reset/seed lifecycle.
   - UI QA workflow.
   - production-negative guard behavior.
   - evidence split from Telegram/payment trust-boundary tests.
3. Run or re-run focused negative checks:
   - `NODE_ENV=production` cannot mount/use test routes.
   - `E2E_TEST_MODE` disabled returns `404`.
   - missing/wrong token returns `403`.
   - unknown persona/scenario returns controlled `400`.
   - arbitrary identity fields are rejected or ignored.
   - cookie/session values are not returned in JSON/logs.
   - `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` fails closed.
4. Run or re-run staging positive checks:
   - `/api/v1/health` non-secret mode facts.
   - reset/seed deterministic baseline.
   - fixed persona session bootstrap for `client_alina`, `seller_plov`, `admin_boss` or supported subset.
   - UI QA smoke evidence from `TASK-FT018-05`.
5. Review deploy isolation evidence from `TASK-FT018-06`:
   - production/staging compose render.
   - Traefik router/service/prefix isolation.
   - volume/log/state separation.
   - deploy script safety.
6. Run repo quality gates:
   - `npm run lint`.
   - focused Jest suites touched by FT-018, especially runtime/auth/checkout/admin/catalog tests.
   - `npm run build:frontend` if frontend/UI fixture code changed.
   - `git diff --check`.
7. Write final report under `.tasks/TASK-FT018-07/`.
8. Update Memory Bank summaries and RTM recommendation only if this execution scope allows docs updates; otherwise report exact recommended changes to orchestrator.
9. Update `.protocols/TASK-FT018-07/{progress,verification}.md`.

## Candidate Touched Files

- `.tasks/TASK-FT018-07/**/*`
- `.protocols/TASK-FT018-07/**/*`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- Implementation files only for explicitly approved critical security fixes.

## Verification Targets

- `REQ-037` evidence complete or precise residual gaps listed.
- Production-negative tests pass for test auth and mock payment guards.
- Staging-positive tests pass for health, reset/seed and fixed-persona sessions.
- UI QA workflow evidence exists and is labeled with evidence limitations.
- Server staging deploy isolation evidence exists.
- No secret/session leakage in health, JSON responses, logs or reports.
- Final quality gates pass or failures are classified as unrelated/blocked with evidence.

## Non-Goals

- No new staging product features.
- No broad refactor.
- No production deploy.
- No real payment provider verification.
- No replacement of Telegram-specific auth/runtime smoke with browser-only evidence.
