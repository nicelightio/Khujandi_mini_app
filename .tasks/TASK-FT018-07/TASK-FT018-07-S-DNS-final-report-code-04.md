---
description: DNS and public staging smoke evidence after Cloudflare record creation.
status: active
---
# TASK-FT018-07 DNS And Public Smoke Report

## Result

`STAGING_PUBLIC_SMOKE_PASS_RESOLVER_CACHE_PENDING`

Cloudflare DNS records for `staging-tgmeal.natureonzoom.win` are visible through public resolvers, and public staging browser smoke passed with an explicit resolver workaround. The remaining issue is local/server resolver cache still returning NXDOMAIN.

## Evidence

- `dig @1.1.1.1 staging-tgmeal.natureonzoom.win A/AAAA` - PASS.
- `dig @8.8.8.8 staging-tgmeal.natureonzoom.win A/AAAA` - PASS.
- `curl --resolve staging-tgmeal.natureonzoom.win:443:<cloudflare-ip> https://staging-tgmeal.natureonzoom.win/api/v1/health` - PASS.
- Browser checkout smoke against `https://staging-tgmeal.natureonzoom.win` with browser host-resolver rule - PASS.
- Evidence file:
  - `.tasks/TASK-FT018-05/ui-qa-public-fixture-2026-05-13T11-45-44-088Z.json`

## Runtime Facts

Public staging health returned:

- `appEnv=staging`
- `nodeEnv=staging`
- `debug=true`
- `paymentProvider=mock`
- `e2eTestMode=true`

## Remaining Blocker

Local system resolver and server resolver still return NXDOMAIN for `staging-tgmeal.natureonzoom.win`. Repeat normal public health/UI QA without resolver workaround after cache expiry.
