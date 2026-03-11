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

# tRPC: query → GET с input в query-параметре, mutation → POST с телом { "json": payload }
# Процедуры-запросы (query):
QUERIES="user.getProfile user.isProfileComplete healthLog.getDailyLog healthLog.listDailyLogs healthLog.summary healthLog.getDailyLogForTelegramUser healthLog.listDailyLogsForTelegramUser healthLog.summaryForTelegramUser bodyMeasurement.listForTelegramUser medicationPlan.listForTelegramUser labResult.listForTelegramUser labPanel.listForTelegramUser"

IS_QUERY=0
for q in $QUERIES; do
  if [[ "$PROCEDURE" == "$q" ]]; then
    IS_QUERY=1
    break
  fi
done

BASE_URL="${API_URL%/}/api/trpc/${PROCEDURE}"

# Нормализация дат для healthLog.* (подстраховка от пустых значений)
if [[ "$PROCEDURE" == "healthLog.getDailyLogForTelegramUser" ]]; then
  PAYLOAD="$(python3 <<'PY' <<<"$PAYLOAD"
import json, sys, datetime
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception:
    print(raw)
    sys.exit(0)
if not data.get("date"):
    data["date"] = datetime.date.today().isoformat()
print(json.dumps(data, ensure_ascii=False))
PY
)"
elif [[ "$PROCEDURE" == "healthLog.summaryForTelegramUser" ]]; then
  PAYLOAD="$(python3 <<'PY' <<<"$PAYLOAD"
import json, sys, datetime
raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception:
    print(raw)
    sys.exit(0)
today = datetime.date.today().isoformat()
if not data.get("fromDate"):
    data["fromDate"] = today
if not data.get("toDate"):
    data["toDate"] = today
print(json.dumps(data, ensure_ascii=False))
PY
)"
fi

if [[ "$IS_QUERY" -eq 1 ]]; then
  # tRPC query: input передаётся как URL-параметр ?input={"json":{...}}
  INPUT_PARAM="{\"json\": ${PAYLOAD}}"
  # URL-encode через python (доступен на любом Linux)
  ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1]))" "$INPUT_PARAM")
  curl -s -X GET \
    "${BASE_URL}?input=${ENCODED}" \
    -H "Content-Type: application/json" \
    -H "X-Service-Token: ${TOKEN}"
else
  # tRPC mutation: тело вида { "json": payload }
  BODY="{\"json\": ${PAYLOAD}}"
  curl -s -X POST \
    "${BASE_URL}" \
    -H "Content-Type: application/json" \
    -H "X-Service-Token: ${TOKEN}" \
    -d "$BODY"
fi
