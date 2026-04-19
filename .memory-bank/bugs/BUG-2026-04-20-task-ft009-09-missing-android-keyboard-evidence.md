---
description: Active quality-gate bug for TASK-FT009-09 because formal closure still lacks fresh real Android Telegram evidence for keyboard-open CTA reachability and degradation fallback behavior.
status: active
---
# BUG-2026-04-20 TASK-FT009-09 Missing Android Keyboard Evidence

## Summary

- `TASK-FT009-09` closed the repo-local shell/degradation subset technically, but formal `/verify` still fails because the task explicitly requires fresh real `Android Telegram` evidence for keyboard-open bottom CTA reachability and degraded fallback behavior.
- The current workspace contains only repo-local lint/Jest evidence plus a placeholder `.tasks/TASK-FT009-09/android-notes.md`, so the hardening wave cannot be marked `PASS` yet.

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

- Final closure for this `FT-009` hardening wave should include operator-confirmed real `Android Telegram` notes proving:
  - keyboard-open keeps the checkout bottom CTA reachable;
  - the degraded runtime path preserves the intended conservative shell-owned CTA behavior;
  - no new shell regression appears on the hardened customer-facing checkout path.

## Actual behavior

- Repo-local deterministic gates pass, but `.tasks/TASK-FT009-09/android-notes.md` still contains only pending placeholder content.
- No fresh operator-confirmed Android Telegram evidence exists for the newly changed bottom-action/degradation semantics.
- Formal `/verify TASK-FT009-09` therefore returns `FAIL`.

## Evidence

- `npm run lint` passes for the `TASK-FT009-09` repo-local closure bundle.
- Focused Jest shell/customer-facing suite passes for `app-shell`, `webapp`, `ui-shell`, `page-shell`, and checkout shell paths.
- `.tasks/TASK-FT009-09/android-notes.md` remains pending and does not contain the required operator-confirmed runtime evidence.
- `.tasks/TASK-FT009-09/TASK-FT009-09-S-VERIFY-final-report-docs-01.md` records the formal `FAIL` verdict on the missing Android evidence gate.

## Impact

- `TASK-FT009-09` cannot be marked `done`.
- The current `FT-009` hardening subset is not formally risk-closed even though repo-local code/tests are in place.
- `/autopilot` must halt on a quality-gate blocker rather than pretend the real-device verify requirement is satisfied.

## Suggested fix

- Run the hardened checkout shell on real `Android Telegram` and record operator-confirmed notes for keyboard-open CTA reachability plus degraded fallback behavior.
- Store the evidence under `.tasks/TASK-FT009-10/` or the linked Android notes artifact.
- Re-run formal verify for the follow-up evidence-closure task before promoting the hardening wave to `done`.

## Follow-up artifacts

- Backlog task: `TASK-FT009-10`
- Related bug: `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
