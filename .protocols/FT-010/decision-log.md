---
description: Decision log для декомпозиции FT-010 в waves и task cards.
status: active
---
# FT-010 Decision Log

## Decisions

- 2026-04-10: `FT-010` декомпозируется как multi-contour delivery одного owner slice `catalog` через shared `mini-app` storefront, отдельный `/seller/*` contour и admin-side provisioning surface, а не как отдельная seller capability.
- 2026-04-10: Отдельный docs-freeze execution task не вводится; feature/contract layer уже достаточно rich, поэтому decomposition начинается с scaffold/foundation tasks.
- 2026-04-10: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT010-0X`.
- 2026-04-10: Seller access обязан переиспользовать существующую Telegram-linked session family; отдельный seller password contour и standalone seller credential store запрещены baseline-ом.
- 2026-04-10: Финальная verification wave обязана отдельно подтвердить `WORKING/NOT_WORKING` public gating и отсутствие delete UI в shared storefront и `/seller/*`.

## Open questions

- Какой минимальный transport лучше для первого `/seller/*` runtime: прямое same-origin cookie reuse уже существующей Mini App session или явный same-user handoff из seller-authenticated mini-app context.
- Достаточно ли для checked-in acceptance dedicated admin-web provisioning screen поверх existing admin contour, или repo потребует дополнительный runtime helper для более детерминированного local/demo provisioning flow.

## Notes

- Primary RTM ownership для feature остается на `REQ-024`, `REQ-025`, `REQ-026`; shared session/storage guardrails наследуются как constraints из `FT-002` и `FT-009`, а не как новый RTM re-allocation.
- Legacy soft-delete behavior в текущем `catalog` коде должен рассматриваться как drift относительно seller visibility direction и не должен сохраняться как канонический продуктовый boundary.
