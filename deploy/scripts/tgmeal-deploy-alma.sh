#!/usr/bin/env bash
set -Eeuo pipefail

APP_USER="${APP_USER:-tgmeal}"
APP_DIR="${APP_DIR:-/srv/tgmeal/app}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-tgmeal}"
PUBLIC_HOST="${TGMEAL_HOST:-tgmeal.natureonzoom.win}"
LOG_DIR="${LOG_DIR:-/var/log/tgmeal}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-0}"
EXPECTED_REMOTE="${EXPECTED_REMOTE:-https://github.com/nicelightio/Khujandi_mini_app.git}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

stamp="$(date +%F_%H%M%S)"
log_file="${LOG_DIR}/deploy-${stamp}.log"

require_root() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "Run as root: this script verifies system services and writes ${LOG_DIR}." >&2
    exit 1
  fi
}

log() {
  printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*"
}

run_as_app() {
  runuser -u "${APP_USER}" -- "$@"
}

compose() {
  run_as_app bash -lc "cd \"${APP_DIR}\" && unset DATABASE_URL TELEGRAM_BOT_TOKEN && exec docker compose --project-name \"${COMPOSE_PROJECT_NAME}\" -f \"${APP_DIR}/docker-compose.yml\" \"\$@\"" bash "$@"
}

require_root
install -d -m 0755 "${LOG_DIR}"
exec > >(tee -a "${log_file}") 2>&1

log "Starting Khujandi/TgMeal deploy on AlmaLinux prod"
log "APP_DIR=${APP_DIR} APP_USER=${APP_USER} PUBLIC_HOST=${PUBLIC_HOST} COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME} DEPLOY_BRANCH=${DEPLOY_BRANCH}"

if [ ! -d "${APP_DIR}/.git" ]; then
  log "ERROR: ${APP_DIR} is not a git checkout. Clone the repo first as ${APP_USER}."
  exit 1
fi

if ! grep -qi 'AlmaLinux' /etc/os-release; then
  log "ERROR: this deploy script is intended for the AlmaLinux production host."
  exit 1
fi

systemctl is-active --quiet docker || { log "ERROR: docker service is not active"; exit 1; }
systemctl is-active --quiet firewalld || log "WARN: firewalld is not active; expected active on current prod"

if ! docker ps --format '{{.Names}}' | grep -qx 'traefik'; then
  log "ERROR: traefik container is not running; do not deploy until the public edge is healthy."
  exit 1
fi

if ! docker network inspect web >/dev/null 2>&1; then
  log "ERROR: external Docker network 'web' is missing; Traefik uses it on this prod host."
  exit 1
fi

for critical in photochanger-app photochanger-pg; do
  if ! docker ps --format '{{.Names}}' | grep -qx "${critical}"; then
    log "WARN: critical container ${critical} is not running. Continue only if this is expected."
  fi
done

actual_remote="$(run_as_app git -C "${APP_DIR}" remote get-url origin)"
if [ "${actual_remote}" != "${EXPECTED_REMOTE}" ] && [ "${actual_remote}" != "${EXPECTED_REMOTE%.git}" ]; then
  log "ERROR: origin remote must be ${EXPECTED_REMOTE}; got ${actual_remote}"
  log "ERROR: deploy is allowed only from GitHub, not from a local source folder or ad-hoc remote."
  exit 1
fi

log "Current git state before pull:"
run_as_app git -C "${APP_DIR}" status --short --branch
if ! run_as_app git -C "${APP_DIR}" diff --quiet || ! run_as_app git -C "${APP_DIR}" diff --cached --quiet; then
  log "ERROR: ${APP_DIR} has local changes. Production deploy must use GitHub-only artifacts."
  log "ERROR: commit through a branch + PR, merge to ${DEPLOY_BRANCH}, then deploy from origin/${DEPLOY_BRANCH}."
  exit 1
fi

log "Fetching and fast-forwarding from GitHub origin/${DEPLOY_BRANCH}"
run_as_app git -C "${APP_DIR}" fetch origin "${DEPLOY_BRANCH}"
run_as_app git -C "${APP_DIR}" checkout "${DEPLOY_BRANCH}"
run_as_app git -C "${APP_DIR}" pull --ff-only origin "${DEPLOY_BRANCH}"
local_head="$(run_as_app git -C "${APP_DIR}" rev-parse HEAD)"
origin_head="$(run_as_app git -C "${APP_DIR}" rev-parse "origin/${DEPLOY_BRANCH}")"
if [ "${local_head}" != "${origin_head}" ]; then
  log "ERROR: local HEAD ${local_head} does not match origin/${DEPLOY_BRANCH} ${origin_head}."
  exit 1
fi
log "Deploying GitHub commit ${local_head} from origin/${DEPLOY_BRANCH}"

log "Validating compose config"
compose config >/tmp/tgmeal-compose-${stamp}.yml
sed -E \
  -e 's#(DATABASE_URL: ).*#\1[REDACTED]#' \
  -e 's#(TELEGRAM_BOT_TOKEN: ).*#\1[REDACTED]#' \
  -e 's#(PROD_SSH_KEY: ).*#\1[REDACTED]#' \
  -e 's#(PROD_SSH_HOST: ).*#\1[REDACTED]#' \
  -e 's#(PROD_SSH_USER: ).*#\1[REDACTED]#' \
  -e 's#(PROD_SSH_PORT: ).*#\1[REDACTED]#' \
  /tmp/tgmeal-compose-${stamp}.yml | sed -n '1,220p'

if [ "${RUN_MIGRATIONS}" = "1" ]; then
  if ! grep -q '^DATABASE_URL=' "${APP_DIR}/.env" || grep -q 'CHANGE_ME' "${APP_DIR}/.env"; then
    log "ERROR: RUN_MIGRATIONS=1 requires an explicit non-placeholder DATABASE_URL in ${APP_DIR}/.env."
    log "ERROR: Confirm it points to a dedicated Khujandi database, never to PhotoChanger DB."
    exit 1
  fi
  log "RUN_MIGRATIONS=1: running Prisma migrate deploy inside api container"
  log "IMPORTANT: DATABASE_URL must point to a dedicated Khujandi database, never to PhotoChanger DB."
  compose run --rm api npx --yes prisma migrate deploy
else
  log "Skipping Prisma migrations. Set RUN_MIGRATIONS=1 only after DATABASE_URL is confirmed as dedicated Khujandi DB."
fi

log "Building images"
compose build

log "Starting/updating containers"
compose up -d

log "Compose status"
compose ps

log "Local container health checks"
# api is internal-only but reachable from the web container network namespace.
compose exec -T web wget -qO- http://api:3001/api/v1/shops >/tmp/tgmeal-api-check-${stamp}.json
compose exec -T web wget -qO- http://127.0.0.1/ >/tmp/tgmeal-web-check-${stamp}.html
wc -c /tmp/tgmeal-api-check-${stamp}.json /tmp/tgmeal-web-check-${stamp}.html

log "Public HTTPS check via Traefik"
for attempt in 1 2 3 4 5 6; do
  if curl -fsSIL "https://${PUBLIC_HOST}/" | sed -n '1,20p' \
    && curl -fsS "https://${PUBLIC_HOST}/api/v1/shops" >/tmp/tgmeal-public-api-check-${stamp}.json; then
    wc -c /tmp/tgmeal-public-api-check-${stamp}.json
    break
  fi
  if [ "${attempt}" = "6" ]; then
    log "ERROR: public HTTPS check failed after ${attempt} attempts."
    exit 1
  fi
  log "WARN: public HTTPS check failed on attempt ${attempt}; waiting for Traefik provider/router refresh."
  sleep 5
done

log "Tail logs"
compose logs --tail=120

log "Deploy completed successfully. Log: ${log_file}"
