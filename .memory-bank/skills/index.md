---
description: Реестр доступных скиллов (когда применять) в этом репозитории.
status: active
---
# Skills

## Installed
- add-tests
- autonomous
- autopilot
- cold-start
- discuss
- execute
- find-skill
- find-skills
- map-codebase
- mb
- mb-execute
- mb-from-prd
- mb-garden
- mb-harness
- mb-init
- mb-map-codebase
- mb-review
- mb-sync
- mb-verify
- prd
- prd-to-tasks
- review
- verify

## When to use
- Bootstrap / entry point: `cold-start`, `mb-init`, `mb`
- PRD -> Memory Bank: `prd`, `mb-from-prd`
- Feature decomposition: `prd-to-tasks`
- Map existing repo: `map-codebase`, `mb-map-codebase`
- Execution: `execute`, `mb-execute`
- Verification: `verify`, `mb-verify`
- Review: `review`, `mb-review`
- Maintenance / sync: `mb-sync`, `mb-garden`
- Harness / autonomy: `mb-harness`, `autonomous`, `autopilot`
- Clarification / discovery: `discuss`, `find-skill`, `find-skills`
- Testing help: `add-tests`
