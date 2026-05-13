---
description: Прогресс выполнения TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Progress

## 2026-05-13

- Protocol artifact created from FT-018 feature spec, contract, runbook, testing policy, implementation plan and handoff.
- Task is execution-ready but not implemented in this subtask.
- Micro-check:
  - Owning capability: runtime/testing enablement.
  - Owning contours: UI QA workflow spanning mini-app/admin-web/seller-web via staging; no product behavior.
  - Touched layers: test fixture/docs/evidence workflow only.
  - Shared justification: none.
- Confirmed prerequisite status:
  - `TASK-FT018-02` verifier report: `PASS` for health/runtime guards.
  - `TASK-FT018-03` verifier report: `PASS` for guarded reset/seed endpoints.
  - `TASK-FT018-04` verifier report: `PASS` for guarded fixed-persona session/personas endpoints.
- Added repo-local fixture:
  - `tests/e2e/staging-ui-qa-fixture.mjs`
  - `tests/e2e/README.md`
- Updated workflow docs:
  - `.memory-bank/testing/staging-ui-qa.md`
  - `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
  - `.memory-bank/guides/staging-server-usage.md`
- Ran local host-OS staging API with temporary state paths outside repo and verified `api-smoke` against `http://127.0.0.1:3001`.
- Generated sanitized evidence:
  - `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-34-016Z.json`
  - `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-40-565Z.json`
  - `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-25-07-701Z.json`
- Historical browser smoke result before the superseding checkout harness update: `BLOCKED`; Playwright package/browser runtime was not installed in this repo/runtime.
- Historical status before superseding update: `implemented-with-browser-smoke-blocked`.

## 2026-05-13 Superseding Update

- Тимлид подтвердил:
  - `E2E_TEST_TOKEN` создается локально и хранится в ignored `.env`;
  - `playwright` добавляется как repo `devDependency`;
  - checkout получает staging-only frontend/dev harness, который использует уже выданную fixed-persona HttpOnly cookie session и не вызывает Telegram auth.
- Добавлен backend checkout bootstrap flag `testSessionAuthAvailable`.
- Frontend checkout теперь пропускает Telegram auth только когда `testSessionAuthAvailable=true`; default/production путь остается Telegram `initData` required.
- Browser smoke rerun прошел локально против host-OS staging:
  - evidence: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T11-15-41-115Z.json`
- Current status: `implemented-with-local-browser-smoke-pass`; server staging smoke остается pending до deploy/render closure.

## Implementation Notes

- The fixture preserves fixed-persona cookies for a Playwright browser context when the local Playwright package is available.
- Evidence records cookie names/attributes only and explicitly states that fixed-persona UI QA does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.
- Full local browser checkout happy path was run through the staging-only cookie-session harness. The fixture intentionally does not forge `initData` or add a production UI bypass.
