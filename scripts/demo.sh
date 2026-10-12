#!/usr/bin/env sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
command=${1:-up}
bootstrap(){
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/workspace" -w /workspace node:22-alpine node scripts/init-demo.cjs
}
case "$command" in
  bootstrap) bootstrap ;;
  up) bootstrap; docker compose --env-file .env.demo -f compose.demo.yml up --build -d --wait ;;
  down) docker compose --env-file .env.demo -f compose.demo.yml down ;;
  status) docker compose --env-file .env.demo -f compose.demo.yml ps ;;
  logs) docker compose --env-file .env.demo -f compose.demo.yml logs --tail=100 ;;
  *) echo 'Usage: ./scripts/demo.sh bootstrap|up|down|status|logs' >&2; exit 2 ;;
esac
