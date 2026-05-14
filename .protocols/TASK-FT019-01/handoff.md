---
description: Handoff для TASK-FT019-01 Staff persistence/domain baseline.
status: active
---
# TASK-FT019-01 Handoff

## Result

Implementation baseline completed for persistence/domain scope.

## Что добавлено

- `AdminAccount` получил operator staff nickname и explicit lifecycle metadata.
- `User` получил courier staff nickname и explicit lifecycle metadata отдельно от `User.isActive`.
- Добавлены structured history tables:
  - `OperatorStaffLifecycleEvent`
  - `CourierStaffLifecycleEvent`
- Добавлены structured manual rating adjustment tables:
  - `OperatorStaffRatingAdjustment`
  - `CourierStaffRatingAdjustment`
- Domain contracts добавлены отдельно в `admin-access` и `delivery-assignment`.

## Что не делалось

- Не добавлялись runtime routes, services, frontend UI, password reset behavior, metrics read models, hard delete или `OrderStatus.FAILED`.
- Shared staff/CRM abstraction не вводился.

## Readiness for TASK-FT019-02

`TASK-FT019-02` может стартовать после verifier/orchestrator acceptance этой foundation-задачи. Следующий task должен реализовывать operator staff account commands внутри `admin-access` поверх `AdminAccount(OPERATOR)`, используя `password_hash` only и boss-only reset/session revocation rules из `admin-auth-contract`.
