---
description: Fix report for TASK-FT018-06 deploy dirty-check verifier blocker.
status: active
---
# TASK-FT018-06 Dirty-Check Fix Report

## Result

Implemented the verifier blocker fix in `deploy/scripts/tgmeal-deploy-alma.sh`.

The deploy script now fails closed when `git status --porcelain --untracked-files=all` is non-empty. This covers modified, staged and untracked files before Docker Compose render/build can use the repository as Docker build context.

## Files Inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.protocols/TASK-FT018-06/context.md`
- `.protocols/TASK-FT018-06/plan.md`
- `.protocols/TASK-FT018-06/progress.md`
- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-VERIFY-final-report-code-01.md`
- `deploy/scripts/tgmeal-deploy-alma.sh`

## Files Changed

- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.protocols/TASK-FT018-06/progress.md`
- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-IMPL-final-report-code-02.md`

## Behavior

- Added `require_clean_git_checkout`.
- The function runs `git status --porcelain --untracked-files=all`.
- Any non-empty output logs the non-clean status and exits before deploy continues.
- The check runs once before fetch/pull and again after fast-forward plus local/origin HEAD equality, immediately before Compose render/build steps.
- Existing GitHub remote, fast-forward branch, HEAD equality and non-destructive behavior were kept.

## Checks Run

- `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — PASS.
- `git diff --check` — PASS.
- `rg -n -- '--porcelain --untracked-files=all|require_clean_git_checkout|docker build context' deploy/scripts/tgmeal-deploy-alma.sh` — PASS.

## Blockers/Risks

- No deploy was run.
- Docker Compose render checks remain blocked in this local environment because Docker Compose is unavailable.
- The worktree contains pre-existing unrelated FT-018/runtime changes; this fix did not revert or normalize them.

## Recommendation

Verifier should rerun the TASK-FT018-06 checklist. The specific untracked-file blocker is addressed; Compose render evidence still needs an environment with Docker Compose.
