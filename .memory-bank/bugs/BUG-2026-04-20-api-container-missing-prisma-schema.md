---
description: Архивированный deploy/runtime bug по неразрешенному canonical Prisma schema path внутри checked-in `api` container image.
status: archived
---
# BUG-2026-04-20 API Container Missing Prisma Schema

## Summary

- На deployed VPS команда `docker compose run --rm api npx --yes prisma migrate status|deploy` падает с `Could not find Prisma Schema`.
- Prisma schema physically exists at `backend/prisma/schema.prisma`, but Prisma CLI is launched from `/app` and, before the fix, only probed default paths `./schema.prisma` and `./prisma/schema.prisma` because the repo did not declare the non-default schema location in checked-in Prisma metadata.
- Это блокировало канонический rollout step с `prisma migrate status` / `prisma migrate deploy` и оставляло deploy-path без формальной DB schema verification.

## Evidence

- VPS shell output (`2026-04-20`):
  - `docker compose run --rm api npx --yes prisma migrate status`
  - `docker compose run --rm api npx --yes prisma migrate deploy`
- Prisma CLI error:

```text
Error: Could not find Prisma Schema that is required for this command.
Checked following paths:

schema.prisma: file not found
prisma/schema.prisma: file not found
```

- Current checked-in deploy build does copy `backend/`, including `backend/prisma/schema.prisma`, into the image.
- Deployed container still starts `scripts/dev-api.ts`, so runtime can serve requests, but Prisma CLI inside the same image was incomplete for migration operations until the repo-level schema path was declared.

## Impact

- Ops cannot run the documented Prisma migration workflow inside the checked-in `api` container.
- Deploy verification for persistence/schema changes is weakened and can silently drift from the repo's canonical runbook.
- Runtime issues that might require schema confirmation become harder to diagnose on VPS.

## Expected behavior

- `docker compose run --rm api npx --yes prisma migrate status`
- `docker compose run --rm api npx --yes prisma migrate deploy`

Both commands should run successfully against the checked-in container image without ad-hoc host-side workarounds.

## Resolution

- Added `"prisma": { "schema": "backend/prisma/schema.prisma" }` plus a pinned repo-local `prisma` dependency to the checked-in root `package.json`, so `npx --yes prisma ...` resolves the schema path and uses a compatible checked-in CLI instead of falling back to a latest-network download.
- Updated the container deploy runbook to use the same checked-in `npx --yes prisma migrate status|deploy` commands and documented that package metadata plus the pinned dependency are now the canonical schema discovery bridge for container CLI operations.
- Repo-local verification now reproduces the pre-fix failure and confirms the post-fix command resolves the schema path and advances to normal database/client checks instead of `Could not find Prisma Schema`.
