---
description: FT-018 staging Playwright QA handoff documentation sync.
status: active
---
# TASK-FT018-07 Handoff Docs Sync

## Result

Updated project docs so a separate Playwright staging QA orchestrator has enough non-secret information to run ordinary staging checks.

## What Changed

- Staging URL is documented as `https://staging-tgmeal.natureonzoom.win`.
- Public staging Playwright smoke command now uses the staging URL, not local `127.0.0.1`.
- Runbooks include DNS preflight before treating public URL failures as app failures.
- Route checklist is explicit for customer Mini App, seller web and admin web.
- Persona handling calls out that `GET /api/v1/test/personas` is the deployed-runtime source of truth and `operator_manager` may be unsupported.
- Evidence boundary is explicit: staging Playwright QA does not prove Telegram HMAC/WebView correctness or real payment provider trust.

## Files Changed

- `tests/e2e/README.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/index.md`
- `.memory-bank/tasks/backlog.md`
- `.protocols/FT-018/handoff.md`

## Checks Run

- `rg` stale staging phrases across `.memory-bank`, `tests/e2e`, `README.md`, `.protocols/FT-018`
- `git diff --check`
- `dig +short staging-tgmeal.natureonzoom.win`
- `dig @1.1.1.1 +short staging-tgmeal.natureonzoom.win`
- `curl -fsS --max-time 15 https://staging-tgmeal.natureonzoom.win/api/v1/health`

## Current External State

- Public resolver `1.1.1.1` resolves `staging-tgmeal.natureonzoom.win` to Cloudflare IPs.
- The local/system resolver in this runner still returns no record for the staging host.
- Plain `curl` from this runner still fails DNS resolution for the staging host.

## Recommendation

The next testing orchestrator can start with the documented DNS preflight. If its runner resolves the hostname normally, it can run the public staging Playwright fixture. If not, record the run as resolver-blocked instead of changing the fixture or weakening the Telegram/payment trust boundaries.
