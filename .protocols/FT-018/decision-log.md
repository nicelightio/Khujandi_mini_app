---
description: Decision log for FT-018 staging runtime and test auth harness.
status: active
---
# FT-018 Decision Log

## 2026-05-13

- Decision: staging/test auth is modeled as `FT-018`, a runtime/testing capability rather than product functionality.
- Rationale: the behavior is needed for QA and deployment confidence, but it must not become customer-facing product semantics.

- Decision: two staging profiles are required: local host-OS staging and server staging through Compose/Traefik.
- Rationale: local staging gives fast implementation feedback; server staging gives production-edge-like UI QA without sharing production state.

- Decision: test auth uses fixed personas and normal session primitives instead of arbitrary identity injection.
- Rationale: UI QA needs deterministic sessions, but arbitrary identities would weaken the production auth model and create a backdoor pattern.

- Decision: `E2E_TEST_MODE=TRUE` plus `NODE_ENV !== "production"` is the hard route guard for test auth; public staging also requires `X-E2E-Test-Token`.
- Rationale: non-production mode alone is not enough on an internet-exposed staging host.

- Decision: UI QA is explicitly separated from Telegram trust-boundary verification.
- Rationale: Playwright/browser tests with fake sessions validate workflows, not Telegram HMAC, replay, `auth_date`, WebView lifecycle or real provider trust.

- Decision: `/prd-to-tasks FT-018` decomposition is represented by execution-ready backlog cards and `.protocols/TASK-FT018-01..07/` artifacts.
- Rationale: downstream `/execute` tasks need deterministic scope, ownership, dependencies and gates; `TASK-FT018-01` treated as docs-first closure, `TASK-FT018-02` later verified `PASS`, and `TASK-FT018-03` became the reset/seed implementation task for the next wave.

- Decision: `TASK-FT018-02` accepted as verified `PASS`; `TASK-FT018-03` был выбран следующей reset/seed implementation task.
- Rationale: verifier evidence подтверждает runtime mode guards и non-secret `/api/v1/health`, а reset/seed и fixed-persona session endpoints намеренно остаются unimplemented для later tasks.

- Decision: `TASK-FT018-03` accepted as verified `PASS`; `TASK-FT018-04` на тот момент стала следующей ready implementation task для fixed-persona test sessions/personas.
- Rationale: verifier evidence подтверждает isolated local staging state paths, guarded reset/seed endpoints, deterministic seed scenarios и production/disabled/token-negative behavior; fixed-persona `/api/v1/test/personas` и `/api/v1/test/session` намеренно остаются unimplemented для следующей task, а `REQ-037` остается planned до полной FT-018 closure.

- Decision: `TASK-FT018-04` accepted as verified `PASS`; `TASK-FT018-05` становится следующей ready implementation task для UI QA fixtures/workflow.
- Rationale: verifier evidence подтверждает guarded fixed-persona `/api/v1/test/personas` и `/api/v1/test/session`, production/disabled `404`, token `403`, fixed metadata, rejection of arbitrary identity authority, normal Mini App/admin cookie/session primitives and no cookie/session values in JSON. `operator_manager` остается controlled unsupported до отдельной seeded manager/operator runtime support, `TASK-FT018-06` остается `PARTIAL`/blocked на Docker Compose render evidence, а `REQ-037` остается planned/partial до полной FT-018 closure.

- Decision: `TASK-FT018-05` accepted as verified `PASS_WITH_BROWSER_SMOKE_BLOCKED`; `TASK-FT018-07` становится следующим final verification/security closure task.
- Rationale: verifier evidence подтверждает, что UI QA fixture берет `UI_QA_BASE_URL` и `E2E_TEST_TOKEN` только из env/secret inputs, выполняет health/reset/seed/personas/fixed-persona session bootstrap, пишет sanitized evidence без cookie/session/token/raw `initData`/payment secrets и явно отделяет UI workflow evidence от Telegram/payment trust-boundary checks. Browser smoke остается честно `BLOCKED` из-за отсутствующего Playwright runtime и не считается pass; full checkout browser happy path остается residual risk. `TASK-FT018-06` остается `PARTIAL`/blocked на обязательных Docker Compose render checks, а `REQ-037` остается planned/partial до полной FT-018 closure.

- Decision: по уточнению тимлида `playwright` добавлен как repo `devDependency`, `E2E_TEST_TOKEN` создается локально в ignored `.env`, а checkout получил staging-only frontend/dev harness для fixed-persona HttpOnly cookie session без Telegram auth только при backend bootstrap `testSessionAuthAvailable=true`.
- Rationale: это закрывает локальный UI QA blocker без расширения production auth semantics. Frontend не принимает самостоятельное решение о bypass; право на harness приходит из backend runtime metadata, которая guard-ится staging/test/debug/e2e/non-production условиями.

- Decision: Docker Compose render для staging должен выполняться на том же хосте, где production, но только из clean GitHub checkout `/srv/tgmeal/staging/app` после landing staging-aware Compose/deploy changes.
- Rationale: локально нет Docker CLI, production checkout на сервере не содержит текущих staging changes, а ручное копирование локальных dirty файлов на сервер не является валидной deploy/render evidence.
