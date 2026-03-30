---
description: HOW-гайд по practical implementation rules для vertical slices и shared extraction.
status: active
---
# Slice Implementation Playbook

## Related architecture

- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): WHAT/WHY по contours, slices и shared boundary rules.

## How to place code

1. Начинай с owning slice, а не с нового shared-модуля.
2. Разложи изменение по слоям `presentation -> application -> domain -> infrastructure` внутри slice.
3. Вынеси код в `shared` только если он уже нужен минимум двум slices и не содержит бизнес-смысла.
4. Если change затрагивает несколько UI-контуров, каждый контур реализует только свой presentation-layer этого же slice.

## How to avoid drift

- Acceptance сценарий должен указывать на owning `FT-*`.
- Domain rules не живут в React components, bot handlers или generic utilities.
- Event names и payloads определяются owning slice, а не transport слоем.

## Practical checklist

- Есть ли один owning slice?
- Сохранились ли слои внутри slice?
- Не появился ли premature shared helper?
- Обновлены ли feature/contract/state docs для этого slice?

## Source artifacts

- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): layered + slice rules.
- [doc/PROJECT_SPECIFICATION.md](../../doc/PROJECT_SPECIFICATION.md): end-to-end capability delivery.
