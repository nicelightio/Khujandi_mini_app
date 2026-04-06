---
description: Роутер по архитектурным документам проекта.
status: active
---
# Architecture Index

- [.memory-bank/architecture/system-contours-and-slices.md](system-contours-and-slices.md): Контуры системы, capability slices и правила границ MVP.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](frontend-presentation-and-webview.md): WHAT/WHY для Mini App shell, frontend slices и Telegram WebView boundary.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](events-polling-and-bot-runtime.md): WHAT/WHY для event transport, polling и Telegram-бота как runtime contour.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](data-boundaries-and-persistence.md): WHAT/WHY для data ownership, persistence boundaries и slice-aware storage model.
- [.memory-bank/architecture/deployment-and-runtime-topology.md](deployment-and-runtime-topology.md): WHAT/WHY для текущего VPS deploy topology через host nginx и containerized app stack.

## Visual companion

- [.memory-bank/diagrams/index.md](../diagrams/index.md): ASCII-карты архитектуры, repo navigation и lifecycle ownership для быстрого входа в контекст.

## Duo pairs

- `system-contours-and-slices` <-> [.memory-bank/guides/slice-implementation-playbook.md](../guides/slice-implementation-playbook.md): как раскладывать реализацию по slices без shared drift.
- `frontend-presentation-and-webview` <-> [.memory-bank/guides/frontend-slices-and-webview.md](../guides/frontend-slices-and-webview.md): как организовать React/Vite frontend и Telegram WebView shell.
- `events-polling-and-bot-runtime` <-> [.memory-bank/guides/events-polling-and-bot-integration.md](../guides/events-polling-and-bot-integration.md): как реализовывать polling, event consumer и bot flows.
- `data-boundaries-and-persistence` <-> [.memory-bank/guides/storage-and-state-implementation.md](../guides/storage-and-state-implementation.md): как раскладывать таблицы, state и persistence hooks без нарушения slice ownership.
- `deployment-and-runtime-topology` <-> [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md): как practically разворачивать и обновлять проект на сервере.
