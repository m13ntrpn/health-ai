/**
 * Router инструментов: карта action → tRPC procedure и исполнитель запросов к nadin-health API.
 * Копировать в проект OpenClaw (например src/agent/toolRouter.ts).
 */

export const ACTION_ROUTES: Record<string, string> = {
  checkProfile: "user.isProfileComplete",
  saveProfile: "user.upsertProfile",
  saveDailyLog: "healthLog.upsertDailyLogForTelegramUser",
  getDailyLog: "healthLog.getDailyLogForTelegramUser",
  listDailyLogs: "healthLog.listDailyLogsForTelegramUser",
  getSummary: "healthLog.summaryForTelegramUser",
  getReport: "healthLog.reportForTelegramUser",
  addLabResult: "labResult.addForTelegramUser",
  listLabResults: "labResult.listForTelegramUser",
  addBodyMeasurement: "bodyMeasurement.addForTelegramUser",
  listBodyMeasurements: "bodyMeasurement.listForTelegramUser",
  addMedicationPlan: "medicationPlan.addForTelegramUser",
  listMedicationPlans: "medicationPlan.listForTelegramUser",
  addLabPanel: "labPanel.addForTelegramUser",
  listLabPanels: "labPanel.listForTelegramUser",
};

export type HealthAction = keyof typeof ACTION_ROUTES;

/**
 * Выполняет вызов nadin-health API по имени действия и payload.
 * payload должен уже содержать telegramUserId и остальные поля процедуры.
 */
export async function executeHealthAction(
  action: HealthAction,
  payload: Record<string, unknown>
): Promise<unknown> {
  const route = ACTION_ROUTES[action];
  if (!route) {
    throw new Error(`Unknown action: ${action}`);
  }

  const baseUrl = process.env.NADIN_HEALTH_API_URL?.replace(/\/$/, "") ?? "";
  const token = process.env.NADIN_HEALTH_SERVICE_TOKEN ?? "";

  const res = await fetch(`${baseUrl}/api/trpc/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Token": token,
    },
    body: JSON.stringify({ json: payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`nadin-health API error ${res.status}: ${text}`);
  }

  return res.json();
}
