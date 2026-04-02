---
description: ASCII-маршрут чтения спецификаций и рабочих артефактов для AI-агентов перед изменением кода.
status: active
---
# Agent Context Routing

## Why this matters

- Схема отвечает на главный вопрос агента: какие документы читать первыми для конкретного типа задачи.
- Она помогает удерживать `specs first`, не перепрыгивая сразу в код или `.tasks/`.

## Diagram

```text
Incoming task
    |
    v
+------------------------------+
| 1. Prime global context      |
|------------------------------|
| .memory-bank/mbb/index.md    |
| .memory-bank/spec-index.md   |
| .memory-bank/index.md        |
| .memory-bank/product.md      |
| .memory-bank/requirements.md |
+------------------------------+
    |
    v
+--------------------------------------------------+
| 2. Pick task family                              |
+--------------------------------------------------+
    |
    +--> Product / scope / acceptance question?
    |      |
    |      +--> epics/EP-*.md
    |      +--> features/FT-*.md
    |
    +--> API / runtime / auth / contracts task?
    |      |
    |      +--> contracts/*.md
    |      +--> states/*.md
    |      +--> architecture/*.md
    |      +--> relevant FT-*.md
    |
    +--> Frontend / Mini App / WebView task?
    |      |
    |      +--> features/FT-009-*.md
    |      +--> architecture/frontend-presentation-and-webview.md
    |      +--> guides/frontend-slices-and-webview.md
    |      +--> relevant feature spec
    |
    +--> Persistence / state / payment integrity?
    |      |
    |      +--> architecture/data-boundaries-and-persistence.md
    |      +--> states/order-lifecycle.md
    |      +--> contracts/payment-confirmation-contract.md
    |      +--> relevant FT-*.md
    |
    +--> Events / polling / bot flow?
    |      |
    |      +--> architecture/events-polling-and-bot-runtime.md
    |      +--> contracts/api-events-baseline.md
    |      +--> contracts/telegram-bot-contract.md
    |      +--> states/order-lifecycle.md
    |
    +--> Verify / repair / bug / regression task?
           |
           +--> testing/index.md
           +--> runbooks/*.md
           +--> bugs/*.md
           +--> only then .tasks/ and .protocols/

After spec priming
    |
    v
Inspect code and task artifacts in repo
```

## Short rule set

- Всегда читать `product.md` и `requirements.md` до выбора кода.
- Для feature-задачи минимальный scoped set: `EP-*` + `FT-*` + нужные `contracts/states/architecture`.
- `.tasks/` и `.protocols/` являются operational memory, а не product/source-of-truth layer.

## Normative sources

- [.memory-bank/mbb/index.md](../mbb/index.md)
- [.memory-bank/spec-index.md](../spec-index.md)
- [.memory-bank/index.md](../index.md)
- [.memory-bank/product.md](../product.md)
- [.memory-bank/requirements.md](../requirements.md)
