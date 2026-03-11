#!/usr/bin/env bash
# nadin.sh — вызов nadin-health tRPC API
#
# Использование:
#   bash nadin.sh <procedure_path> '<json_object>'
#   echo '<json_object>' | bash nadin.sh <procedure_path>
#   bash nadin.sh <procedure_path> - < payload.json
#
# Примеры:
#   bash nadin.sh user.isProfileComplete '{"telegramUserId":"123456789"}'
#   bash nadin.sh healthLog.upsertDailyLogForTelegramUser '{"telegramUserId":"123456789","date":"2026-03-06","payload":{"waterMl":2000}}'
#
# Для больших payload (много блюд, сложный JSON) — передавай через stdin:
#   cat <<'EOF' | bash nadin.sh healthLog.upsertDailyLogForTelegramUser
#   {"telegramUserId":"123","date":"2026-03-11","payload":{"meals":[...]}}
#   EOF

set -euo pipefail

PROCEDURE="${1:-}"

if [[ -z "$PROCEDURE" ]]; then
  echo '{"error":"Usage: nadin.sh <procedure> [json_payload|-]"}' >&2
  exit 1
fi

# Читаем payload: из stdin если второй аргумент отсутствует или равен "-"
if [[ "${2:-}" == "-" || -z "${2:-}" ]]; then
  PAYLOAD="$(cat)"
else
  PAYLOAD="${2}"
fi

if [[ -z "$PAYLOAD" ]]; then
  echo '{"error":"Payload is empty"}' >&2
  exit 1
fi

# Валидация JSON перед отправкой
if ! python3 -c "import json,sys; json.loads(sys.argv[1])" "$PAYLOAD" 2>/dev/null; then
  echo '{"error":"Invalid JSON payload"}' >&2
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

# tRPC: query → GET с input в query-параметре, mutation → POST с телом { "json": payload }
QUERIES="user.getProfile user.isProfileComplete healthLog.getDailyLog healthLog.listDailyLogs healthLog.summary healthLog.getDailyLogForTelegramUser healthLog.listDailyLogsForTelegramUser healthLog.summaryForTelegramUser bodyMeasurement.listForTelegramUser medicationPlan.listForTelegramUser labResult.listForTelegramUser labPanel.listForTelegramUser"

IS_QUERY=0
for q in $QUERIES; do
  if [[ "$PROCEDURE" == "$q" ]]; then
    IS_QUERY=1
    break
  fi
done

BASE_URL="${API_URL%/}/api/trpc/${PROCEDURE}"

if [[ "$IS_QUERY" -eq 1 ]]; then
  # tRPC query: input передаётся как URL-параметр ?input={"json":{...}}
  ENCODED=$(python3 -c "
import json, urllib.parse, sys
payload = json.loads(sys.argv[1])
wrapped = json.dumps({'json': payload})
print(urllib.parse.quote(wrapped))
" "$PAYLOAD")
  curl -s -X GET \
    "${BASE_URL}?input=${ENCODED}" \
    -H "Content-Type: application/json" \
    -H "X-Service-Token: ${TOKEN}"
else
  # tRPC mutation: тело вида { "json": payload }, собираем через python чтобы избежать проблем экранирования
  BODY=$(python3 -c "
import json, sys
payload = json.loads(sys.argv[1])
print(json.dumps({'json': payload}))
" "$PAYLOAD")
  curl -s -X POST \
    "${BASE_URL}" \
    -H "Content-Type: application/json" \
    -H "X-Service-Token: ${TOKEN}" \
    -d "$BODY"
fi
