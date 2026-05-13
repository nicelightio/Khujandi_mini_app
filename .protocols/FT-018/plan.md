---
description: Protocol plan and handoff for FT-018 staging runtime and test auth harness.
status: active
---
# FT-018 Protocol Plan

## Scope

- Feature: `FT-018` staging runtime and staging-only test auth harness.
- Owning capability: runtime/testing enablement, not a product slice.
- Touched contours: `mini-app`, `seller-web`, `admin-web`; `telegram-bot` only as separate verification track.
- Touched layers: runtime config/deploy, backend test-only presentation/application endpoints, reset/seed infrastructure, UI QA workflow docs.
- Shared justification: no shared extraction by default; a small env guard helper is allowed only if implementation duplicates safety checks.

## Inputs Read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `docker-compose.yml`
- `scripts/dev-api.ts`
- `vite.config.mjs`

## Decomposition Strategy

- Wave 1 freezes docs and handoff artifacts.
- Wave 2 adds runtime mode guards and non-secret health surface.
- Wave 3 adds deterministic staging reset/seed.
- Wave 4 adds fixed-persona session bootstrap.
- Wave 5 connects UI QA fixtures/workflow.
- Wave 6 parameterizes server staging deploy separately from production.
- Wave 7 performs security review and final verification.

## Gate

- Implementation must start from [.memory-bank/tasks/plans/IMPL-FT-018.md](../../.memory-bank/tasks/plans/IMPL-FT-018.md).
- Production-negative guard tests are required before exposing any test auth endpoint on a public staging host.
- Server staging deploy must prove separate host, project, volume and router names before any shared host rollout.
- UI QA evidence must not be used as Telegram auth correctness evidence.
