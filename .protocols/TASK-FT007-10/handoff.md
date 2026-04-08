# TASK-FT007-10 Handoff

- Completed.
- User-visible fix: `/admin/login` now renders the admin login flow instead of falling back to the customer catalog on deployed/static builds.
- Deploy implication: after pulling the change, rebuild the web container or rerun `npm run build:frontend` in non-container environments.
