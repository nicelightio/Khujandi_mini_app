---
description: Advisory pre-release risk for TASK-FT009-09 because formal Android Telegram evidence for keyboard-open CTA reachability and degradation fallback behavior is incomplete.
status: active
---
# BUG-2026-04-20 TASK-FT009-09 Missing Android Keyboard Evidence

## Summary

- `TASK-FT009-09` closed the repo-local shell/degradation subset technically. The project decision on 2026-04-27 downgraded fresh real `Android Telegram` evidence from blocking gate to advisory pre-release risk check.
- The current workspace contains repo-local lint/Jest evidence plus incomplete `.tasks/TASK-FT009-09/android-notes.md`; this no longer blocks repo-local closure, but it remains an explicit release risk.

## Detection

- Date: `2026-04-20`
- Detection mode: formal `/verify TASK-FT009-09` during resumed `/autopilot` run
- Reviewed artifacts:
  - `.protocols/TASK-FT009-09/verification.md`
  - `.tasks/TASK-FT009-09/android-notes.md`
  - `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
  - `.memory-bank/testing/index.md`
  - `.memory-bank/tasks/backlog.md`

## Expected behavior

- Advisory pre-release smoke for this `FT-009` hardening wave should include operator-confirmed real `Android Telegram` notes proving:
  - keyboard-open keeps the checkout bottom CTA reachable;
  - the degraded runtime path preserves the intended conservative shell-owned CTA behavior;
  - no new shell regression appears on the hardened customer-facing checkout path.

## Actual behavior

- Repo-local deterministic gates pass, but `.tasks/TASK-FT009-09/android-notes.md` still contains only pending placeholder content.
- No fresh operator-confirmed Android Telegram evidence exists for the newly changed bottom-action/degradation semantics.
- Under the previous policy formal `/verify TASK-FT009-09` returned `FAIL`; under the updated policy this is an advisory pre-release risk, not a repo-local blocker.

## Evidence

- `npm run lint` passes for the `TASK-FT009-09` repo-local closure bundle.
- Focused Jest shell/customer-facing suite passes for `app-shell`, `webapp`, `ui-shell`, `page-shell`, and checkout shell paths.
- `.tasks/TASK-FT009-09/android-notes.md` remains pending and does not contain the required operator-confirmed runtime evidence.
- `.tasks/TASK-FT009-09/TASK-FT009-09-S-VERIFY-final-report-docs-01.md` records the formal `FAIL` verdict on the missing Android evidence gate.

## Impact

- `TASK-FT009-09` can be marked `done` for repo-local closure.
- The current `FT-009` hardening subset still carries pre-release WebView risk until Android smoke is recorded.
- Execution should not halt repo-local closure on this missing evidence, but release notes/checklist must keep the risk visible.

## Suggested fix

- Before release, run the hardened checkout shell on real `Android Telegram` and record operator-confirmed notes for keyboard-open CTA reachability plus degraded fallback behavior.
- Store the evidence under `.tasks/TASK-ANDROID-ADVISORY-PRE-RELEASE/` or the linked Android notes artifact.
- Do not block repo-local task closure solely on missing fresh Android notes.

## Follow-up artifacts

- Backlog task: `TASK-FT009-10`
- Related bug: `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
