---
description: Реестр normative docs и маршрутизация по source-of-truth документам.
status: active
---
# Spec Index

## Purpose
- Используй этот файл как роутер по явным normative docs.
- Если раздел не нужен проекту, оставь ссылку-плейсхолдер или отметь `not used`.

## Global
- [.memory-bank/glossary.md](glossary.md): Термины и agreed vocabulary.
- [.memory-bank/invariants.md](invariants.md): Глобальные MUST/NEVER правила.

## Normative domains
- [.memory-bank/contracts/index.md](contracts/index.md): Контракты интерфейсов и boundary specs.
- [.memory-bank/states/index.md](states/index.md): Lifecycle/state rules.
- [.memory-bank/runbooks/index.md](runbooks/index.md): Operational procedures.
- [.memory-bank/testing/index.md](testing/index.md): Verification basis и quality gates.

## Runtime/testing extensions
- [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](features/FT-018-staging-runtime-and-test-auth-harness.md): Staging runtime и test auth harness как runtime/testing capability.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](contracts/staging-test-auth-harness-contract.md): Guarded fixed-persona test session contract.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](runbooks/staging-runtime-and-ui-qa.md): Local/server staging workflow и UI QA handoff.
- [.memory-bank/testing/staging-ui-qa.md](testing/staging-ui-qa.md): Playwright/UI QA evidence policy и trust-boundary split.

## Compatibility note
- Duo docs в `architecture/` и `guides/` остаются валидными.
- [.memory-bank/diagrams/index.md](diagrams/index.md): derived visual layer для быстрой навигации; нормативным источником остаются связанные spec docs.
- Этот слой уточняет source-of-truth, а не отменяет duo docs.
- Для текущего MVP baseline используй также [.memory-bank/architecture/index.md](architecture/index.md) и [.memory-bank/guides/index.md](guides/index.md).
