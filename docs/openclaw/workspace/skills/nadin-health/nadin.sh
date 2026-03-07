#!/usr/bin/env bash
# nadin.sh — вызов nadin-health tRPC API
#
# Использование:
#   bash nadin.sh <procedure_path> '<json_object>'
#
# Примеры:
#   bash nadin.sh user.isProfileComplete '{"telegramUserId":"123456789"}'
#   bash nadin.sh healthLog.upsertDailyLogForTelegramUser '{"telegramUserId":"123456789","date":"2026-03-06","payload":{"waterMl":2000}}'

set -euo pipefail

PROCEDURE="${1:-}"
PAYLOAD="${2:-}"

if [[ -z "$PROCEDURE" || -z "$PAYLOAD" ]]; then
  echo '{"error":"Usage: nadin.sh <procedure> <json_payload>"}' >&2
  exit 1
fi

API_URL="${NADIN_HEALTH_API_URL:-}"
TOKEN="${NADIN_HEALTH_SERVICE_TOKEN:-}"

if [[ -z "$API_URL" ]]; then
  echo '{"error":"NADIN_HEALTH_API_URL is not set"}' >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo '{"error":"NADIN_HEALTH_SERVICE_TOKEN is not set"}' >&2
  exit 1
fi

# tRPC ожидает тело вида { "json": <payload> }
BODY="{\"json\": ${PAYLOAD}}"

curl -s -X POST \
  "${API_URL%/}/api/trpc/${PROCEDURE}" \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: ${TOKEN}" \
  -d "$BODY"
