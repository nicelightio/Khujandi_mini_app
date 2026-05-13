---
description: Прогресс выполнения TASK-FT018-07 security review and final verification/evidence closure.
status: active
---
# TASK-FT018-07 Progress

## 2026-05-13

- Protocol artifact created from FT-018 feature spec, contract, runbook, testing policy, implementation plan and handoff.
- Task is execution-ready but not implemented in this subtask.
- Security/evidence review executed as reviewer subagent.
- Scope micro-check:
  - Owning capability/slice: `runtime/testing enablement`.
  - Owning contours: `mini-app`, `seller-web`, `admin-web`; `telegram-bot` remains evidence-split/advisory only.
  - Touched layers: verification/protocol/task evidence docs only.
  - Shared justification: none.
- Historical status before superseding checkout/browser update: `PASS_WITH_BLOCKERS`.

## Evidence Matrix Summary

- Runtime mode/health: `PASS`; focused tests prove non-secret `/api/v1/health`, `E2E_TEST_MODE=TRUE` production refusal, `DEBUG=TRUE` production effective false, and test route absence when disabled.
- Mock payment guard: `PASS`; focused tests prove `PAYMENT_PROVIDER=mock` is refused in production and requires `APP_ENV=local|test|staging` or `E2E_TEST_MODE=TRUE`; `DEBUG=TRUE` alone is not trusted checkout.
- Reset/seed: `PASS`; focused tests prove disabled/production absence, token `403`, fixed scenario validation, deterministic reset/seed summaries, and no broad filesystem/Docker cleanup in implementation.
- Fixed-persona sessions: `PASS_WITH_LIMITATION`; focused tests prove token guard, fixed persona allowlist, arbitrary identity field rejection, normal Mini App/admin cookie primitives, no JSON cookie/session value echo. `operator_manager` remains controlled unsupported.
- UI QA fixture: `PASS_LOCAL`; API fixture evidence is sanitized and passed in TASK-FT018-05. Superseding browser smoke passes locally through the staging-only fixed-persona cookie-session checkout harness; server staging smoke remains pending until deploy/render closure.
- Server staging deploy profile: `PARTIAL`; static production/staging isolation and dirty-check safety evidence pass, but required `docker compose config` production/staging renders are `BLOCKED` because no Docker Compose binary exists in this environment.
- Secret/session leakage review: `PASS_WITH_SCOPE_LIMIT`; generated UI QA evidence contains cookie names/attributes only, not token/cookie/session values. Static search found only documented placeholders/code symbols, not tracked secret values in reviewed evidence.
- Trust-boundary split: `PASS`; FT-018 evidence explicitly does not claim Telegram HMAC/replay/WebView or real payment-provider correctness from UI QA/mock payment.

## Terminal Classification

- Result: `PASS_WITH_SERVER_RENDER_DEPLOY_BLOCKERS`.
- `REQ-037` must remain not verified until Docker Compose render and approved staging branch/GitHub/compose/deploy gates are complete.
