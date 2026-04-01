---
description: MBB compliance review for Memory Bank structure, frontmatter, and routers.
status: active
---
# TASK-MB-REVIEW S-05

## Verdict

`APPROVE`

## Notes

1. Frontmatter coverage выглядит консистентной across sampled `.memory-bank/**/*.md`; обязательный `description:` присутствует.
2. Router coverage на текущий момент достаточна: для `epics`, `features`, `architecture`, `guides`, `contracts`, `states`, `runbooks`, `workflows`, `commands`, `adrs` есть `index.md`.
3. Верхнеуровневый `.memory-bank/index.md` ссылается на `spec-index`, normative domains и `workflows`, поэтому явного navigation gap в текущем дереве нет.
4. Empty helper folders (`agents`, `archive`, `bugs`, `domains`, `quality`, `tech-specs`) сами по себе не нарушают MBB, так как пока не содержат docs, требующих router coverage.

## Residual risk

1. `glob`-поиск по hidden path в harness вёл себя нестабильно, поэтому часть проверки делалась через targeted reads/grep; если нужен полностью автоматический MBB lint, его стоит оформить отдельным script/check, но это уже enhancement, а не текущий defect.
