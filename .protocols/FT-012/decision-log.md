# FT-012 Decision Log

## 2026-04-25

- Decision: decompose `FT-012` as a `catalog`-owned customer workflow over the existing public storefront, not as a new shared cart domain module.
- Rationale: the Memory Bank contract explicitly says composition is customer intent before payment and the cross-slice boundary is the payload contract only.
- Consequence: tasks focus on frontend composition state, single-shop UX, payload production and validation feedback; payment/order semantics remain in `FT-013`/`FT-002`.

## 2026-04-25

- Decision: keep `TASK-FT012-01` docs/contract freeze as the first ready task even though the core feature spec exists.
- Rationale: execution needs deterministic field names, frontend storage policy, and test targets before UI work starts.
- Consequence: downstream implementation tasks remain `planned` until the freeze confirms no missing spec gaps.
