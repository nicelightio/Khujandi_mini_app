---
description: ASCII-схемы для быстрой ориентации AI-агентов по спецификациям, коду и runtime-потокам проекта.
status: active
---
# Diagrams Index

## Purpose

- Этот раздел содержит derived ASCII-схемы для быстрого входа в контекст.
- Схемы не заменяют нормативные документы; источником истины остаются связанные spec docs.
- Основная цель раздела: сократить время на первичную навигацию для AI-агентов перед реализацией, проверкой и review.

## Reading order

- [.memory-bank/diagrams/agent-context-routing.md](agent-context-routing.md): какой spec-path читать первым в зависимости от типа задачи.
- [.memory-bank/diagrams/implementation-coverage-and-repo-map.md](implementation-coverage-and-repo-map.md): что уже реализовано в коде и где это лежит в репозитории.
- [.memory-bank/diagrams/system-runtime-overview.md](system-runtime-overview.md): системные контуры и расширенная `SYSTEM`-схема layered monolith + vertical slices.
- [.memory-bank/diagrams/slice-boundaries-and-dependencies.md](slice-boundaries-and-dependencies.md): разрешенные зависимости, `LAYER VIEW` Mini App frontend и правило единого runtime adapter.
- [.memory-bank/diagrams/order-lifecycle-and-feature-ownership.md](order-lifecycle-and-feature-ownership.md): state machine заказа, cancellation/refund и ownership по feature boundaries.

## Usage rule

- Начинай со схемы, но принимай решения по связанным `product`, `requirements`, `EP-*`, `FT-*`, `contracts/*`, `states/*` и `architecture/*`.
