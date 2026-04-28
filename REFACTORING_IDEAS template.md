# Refactoring Ideas

## Prompt

```text
Сформируй заново `REFACTORING_IDEAS.md` для этого проекта.

Правила:
- Сначала выполни project priming по `AGENTS.md`: прочитай `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md` если есть, `.memory-bank/index.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, затем минимально нужные architecture/contracts/testing docs.
- Анализируй только production/source code. Исключи `tests/`, `frontend/src/tests/`, `*.test.*`, `.tasks/`, `.protocols/`, `node_modules`, build/dist/coverage artifacts.
- Найди 10 самых больших code-файлов проекта при условии, что каждый больше 300 строк.
- Для каждого из 10 файлов запусти отдельного read-only subagent. Subagent ничего не должен менять в коде.
- Каждый subagent должен оценить файл на рефакторинг согласно архитектуре проекта: modular/layered monolith, vertical slices, boundaries через contracts/interfaces/schemas, без широкого `shared` до доказанной повторяемости.
- Каждый subagent должен искать неадекватные, кривые, накостыленные, duplicated, overgrown, brittle, security/data/performance-risky решения, которые можно оптимизировать.
- По каждому файлу нужен короткий conclusion: имеет ли смысл рефакторить, почему, и какое минимальное направление рефакторинга лучше.
- Отдельно найди `.memory-bank/**/*.md` больше 300 строк и выведи их только списком без анализа.
- Итог запиши в `REFACTORING_IDEAS.md`: top-10 code files с line counts, executive verdict, file-by-file conclusions, suggested refactor order, spec-layer files over 300 lines, implementation constraints.
- Не меняй production code, tests и Memory Bank. Менять можно только `REFACTORING_IDEAS.md`.
- После записи проверь UTF-8 без BOM, отсутствие trailing whitespace и `git diff --check`.
```
