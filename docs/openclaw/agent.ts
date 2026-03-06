/**
 * Полный pipeline агента nadin: от сообщения Telegram до ответа.
 * Копировать в проект OpenClaw (например src/agent/agent.ts).
 *
 * Подключи runNadinPipeline к обработчику входящих сообщений Telegram
 * (после получения message.from.id и message.text).
 */

import { detectIntent } from "./intentDetector";
import { parseUserMessage } from "./parser";
import { loadMemory, saveMessage } from "./memory";
import { loadUserFacts } from "./userFacts";
import { executeHealthAction, ACTION_ROUTES, type HealthAction } from "./toolRouter";
import { buildContextFromReport, buildContextFromProfile } from "./contextBuilder";
import { validateResponse } from "./responseValidator";
import { getSystemPrompt } from "./prompts/systemPrompt";

export interface TelegramMessage {
  from: { id: number };
  text?: string;
}

export interface PipelineResult {
  reply: string;
  actionCalled?: HealthAction;
}

/**
 * Основной pipeline:
 * 1. detectIntent
 * 2. при необходимости parser
 * 3. loadMemory + loadUserFacts
 * 4. вызов tool через executeHealthAction (payload с telegramUserId)
 * 5. сбор контекста из ответа API (contextBuilder)
 * 6. вызов LLM (systemPrompt + context + history + userMessage)
 * 7. validateResponse
 * 8. saveMessage (user + assistant)
 * 9. вернуть reply для отправки в Telegram
 */
export async function runNadinPipeline(
  message: TelegramMessage,
  today: string
): Promise<PipelineResult> {
  const telegramUserId = String(message.from.id);
  const userText = message.text?.trim() ?? "";

  if (!userText) {
    return { reply: "Напиши что-нибудь, и я постараюсь помочь." };
  }

  const intent = await detectIntent(userText);
  let apiPayload: Record<string, unknown> = { telegramUserId };
  let action: HealthAction | undefined;
  let dataContext = "";

  if (intent === "chat") {
    const facts = await loadUserFacts(telegramUserId);
    dataContext =
      "--- DATA CONTEXT ---\nДолгосрочные факты: " +
      JSON.stringify(facts, null, 2) +
      "\n--- END DATA CONTEXT ---";
  } else {
    action = mapIntentToAction(intent, userText, today, apiPayload);
    if (action) {
      const route = ACTION_ROUTES[action];
      if (route) {
        const res = await executeHealthAction(action as HealthAction, apiPayload);
        const unwrapped = unwrapTrpcResult(res);
        if (action === "getReport" && unwrapped) {
          dataContext = buildContextFromReport(unwrapped as Parameters<typeof buildContextFromReport>[0]);
        } else if (action === "checkProfile" && unwrapped) {
          const profile = (unwrapped as { profile?: unknown }).profile;
          dataContext = buildContextFromProfile(
            profile as Parameters<typeof buildContextFromProfile>[0]
          );
        } else {
          dataContext = `Ответ API: ${JSON.stringify(unwrapped)}`;
        }
      }
    }
  }

  const history = await loadMemory(telegramUserId);
  const systemPrompt = getSystemPrompt();
  const messagesForLlm = [
    { role: "system" as const, content: systemPrompt + "\n\n" + dataContext },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userText },
  ];

  let reply = await callLlm(messagesForLlm);
  const isValid = await validateResponse(reply, dataContext.slice(0, 2000));
  if (!isValid) {
    reply = await callLlm([
      ...messagesForLlm,
      { role: "assistant" as const, content: reply },
      { role: "user" as const, content: "Перепиши ответ без выдуманных фактов и цифр." },
    ]);
  }

  await saveMessage(telegramUserId, "user", userText);
  await saveMessage(telegramUserId, "assistant", reply);

  return { reply, actionCalled: action };
}

function mapIntentToAction(
  intent: string,
  userText: string,
  today: string,
  payload: Record<string, unknown>
): HealthAction | undefined {
  switch (intent) {
    case "report":
      return "getReport";
    case "log_food":
    case "log_water":
    case "log_sleep":
    case "log_activity":
      // Здесь нужно вызвать parser и собрать payload для saveDailyLog
      payload.date = today;
      payload.payload = {}; // TODO: parseUserMessage(userText) и маппинг в payload
      return "saveDailyLog";
    case "profile_update":
      return "saveProfile";
    case "add_measurement":
      payload.payload = {}; // TODO: из parser или LLM
      return "addBodyMeasurement";
    case "lab_result":
      payload.payload = { rawSummary: userText };
      return "addLabResult";
    case "medication":
      payload.payload = { name: userText };
      return "addMedicationPlan";
    default:
      return undefined;
  }
}

function unwrapTrpcResult(res: unknown): unknown {
  if (res && typeof res === "object" && "result" in res) {
    const r = (res as { result?: { data?: { json?: unknown } } }).result;
    return r?.data?.json ?? r;
  }
  return res;
}

async function callLlm(
  messages: { role: string; content: string }[]
): Promise<string> {
  // TODO: вызов OpenRouter/LLM с messages; вернуть content последнего ответа.
  throw new Error("Implement OpenRouter/LLM call");
}
