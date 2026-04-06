---
description: Роутер по command-spec файлам (slash commands).
status: active
---
# Commands

- [.memory-bank/commands/add-tests.md](add-tests.md): Добавление тестов — unit/integration/e2e с приоритезацией по core value.
- [.memory-bank/commands/autonomous.md](autonomous.md): Полный автономный прогон PRD → FT → TASKs → execute/verify/review до terminal state.
- [.memory-bank/commands/autopilot.md](autopilot.md): Автономный прогон backlog задач (TASK-*) в чистых сессиях Codex/Claude.
- [.memory-bank/commands/cold-start.md](cold-start.md): Единая точка входа — выбрать сценарий и запустить правильный флоу (PRD / map-codebase / skeleton-only).
- [.memory-bank/commands/discuss.md](discuss.md): Прояснение неизвестных и противоречий перед реализацией — вопросы и decision log.
- [.memory-bank/commands/execute.md](execute.md): Выполнение одной задачи (TASK-XXX) по протоколу: plan → build → gates → verify → MB-SYNC.
- [.memory-bank/commands/find-skill.md](find-skill.md): Поиск подходящего скилла для задачи: сначала установленные в проекте, затем marketplace.
- [.memory-bank/commands/find-skills.md](find-skills.md): Поиск релевантных skills: сначала установленные в проекте, потом marketplace.
- [.memory-bank/commands/map-codebase.md](map-codebase.md): Маппинг существующего репозитория в Memory Bank (brownfield → baseline docs).
- [.memory-bank/commands/mb-execute.md](mb-execute.md): Алиас флоу выполнения одной задачи (TASK-XXX). Используй /execute.
- [.memory-bank/commands/mb-from-prd.md](mb-from-prd.md): Алиас флоу “PRD → Memory Bank”. Используй /prd.
- [.memory-bank/commands/mb-garden.md](mb-garden.md): Регулярное обслуживание Memory Bank: линт, чистка, архивация, устранение drift.
- [.memory-bank/commands/mb-harness.md](mb-harness.md): Хелпер по harness-настройкам: чистые сессии, профили Codex, детерминированные гейты.
- [.memory-bank/commands/mb-init.md](mb-init.md): Алиас “инициализировать skeleton Memory Bank”. По сути это init-mb.js + базовые файлы.
- [.memory-bank/commands/mb-map-codebase.md](mb-map-codebase.md): Алиас флоу “map repo → baseline Memory Bank (as-is)”. Используй /map-codebase.
- [.memory-bank/commands/mb-red-verify.md](mb-red-verify.md): Алиас adversarial semantic verification задачи (TASK-XXX). Используй /red-verify.
- [.memory-bank/commands/mb-review.md](mb-review.md): Алиас multi-expert review. Используй /review.
- [.memory-bank/commands/mb-sync.md](mb-sync.md): Синхронизация Memory Bank после изменения: обновить индексы, RTM/backlog и changelog.
- [.memory-bank/commands/mb-verify.md](mb-verify.md): Алиас верификации задачи (TASK-XXX). Используй /verify.
- [.memory-bank/commands/mb.md](mb.md): Прайминг агента — загрузка контекста проекта из Memory Bank перед работой.
- [.memory-bank/commands/prd-to-tasks.md](prd-to-tasks.md): Декомпозиция фичи в implementation plan и атомарные задачи (waves).
- [.memory-bank/commands/prd.md](prd.md): Превращение PRD в Memory Bank — product brief, требования, эпики, фичи, RTM.
- [.memory-bank/commands/red-verify.md](red-verify.md): Adversarial semantic verification задачи (TASK-XXX) для поиска "дисциплинированно, но по существу неверно".
- [.memory-bank/commands/review.md](review.md): Multi-expert ревью Memory Bank (fresh context) с артефактами в .tasks/TASK-MB-REVIEW/.
- [.memory-bank/commands/verify.md](verify.md): Верификация выполненной задачи по acceptance criteria + evidence, итог PASS/FAIL.
