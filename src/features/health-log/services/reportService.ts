import { prisma } from "@/shared/lib/prisma";
import { logger } from "@/shared/lib/logger";
import { dateStringToDateTime } from "./dateUtils";

export interface ReportInput {
  userId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  goals?: string | null;
}

export interface HealthReport {
  summary: string;
  advice: string[];
}

/** Aggregates health data for a period into a context object for the LLM. */
async function buildReportContext(input: ReportInput) {
  const from = dateStringToDateTime(input.fromDate);
  const to = dateStringToDateTime(input.toDate);

  const [logs, profile] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { userId: input.userId, date: { gte: from, lte: to } },
      include: { meals: true, sleepLogs: true, activityLogs: true },
    }),
    prisma.userProfile.findUnique({ where: { userId: input.userId } }),
  ]);

  const totalCalories = logs.flatMap((l) => l.meals).reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProteinG = logs.flatMap((l) => l.meals).reduce((s, m) => s + (m.proteinG != null ? Number(m.proteinG) : 0), 0);
  const totalFatG = logs.flatMap((l) => l.meals).reduce((s, m) => s + (m.fatG != null ? Number(m.fatG) : 0), 0);
  const totalCarbsG = logs.flatMap((l) => l.meals).reduce((s, m) => s + (m.carbsG != null ? Number(m.carbsG) : 0), 0);
  const totalWaterMl = logs.reduce((s, l) => s + (l.waterMl ?? 0), 0);

  const sleepDurations = logs.flatMap((l) =>
    l.sleepLogs
      .filter((s) => s.start && s.end)
      .map((s) => (s.end!.getTime() - s.start!.getTime()) / 3600000),
  );
  const avgSleepH = sleepDurations.length
    ? sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length
    : null;

  const totalActivityMin = logs.flatMap((l) => l.activityLogs).reduce((s, a) => s + (a.durationMin ?? 0), 0);
  const daysCount = logs.length;
  const completedDays = logs.filter((l) => l.isCompleted).length;

  return {
    period: { from: input.fromDate, to: input.toDate, daysWithLogs: daysCount, completedDays },
    nutrition: {
      totalCalories,
      avgCaloriesPerDay: daysCount ? Math.round(totalCalories / daysCount) : 0,
      totalProteinG: Math.round(totalProteinG),
      totalFatG: Math.round(totalFatG),
      totalCarbsG: Math.round(totalCarbsG),
      totalWaterMl,
      avgWaterMlPerDay: daysCount ? Math.round(totalWaterMl / daysCount) : 0,
    },
    sleep: { avgHoursPerNight: avgSleepH != null ? Math.round(avgSleepH * 10) / 10 : null },
    activity: { totalMinutes: totalActivityMin, avgMinPerDay: daysCount ? Math.round(totalActivityMin / daysCount) : 0 },
    profile: profile
      ? {
          age: profile.age,
          sex: profile.sex,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg != null ? Number(profile.weightKg) : null,
          goals: profile.goals,
          conditions: profile.conditions,
          activityLevel: profile.activityLevel,
        }
      : null,
  };
}

function buildPrompt(ctx: Awaited<ReturnType<typeof buildReportContext>>): string {
  const goal = ctx.profile?.goals ?? null;
  const tone = goal
    ? "Ты дружелюбный и заботливый помощник по здоровью. У пользователя есть цель. Оцени прогресс, дай конкретные советы по питанию, сну и активности. Будь поддерживающим, не осуждай."
    : "Ты дружелюбный и заботливый помощник по здоровью. Цели пока нет. Оцени общее состояние, отметь позитивные моменты и мягко укажи, что стоит улучшить. Будь тёплым и поддерживающим.";

  return `${tone}

Данные за период ${ctx.period.from} — ${ctx.period.to}:
- Дней с записями: ${ctx.period.daysWithLogs}, завершённых дней: ${ctx.period.completedDays}
- Калории: всего ${ctx.nutrition.totalCalories} ккал, в среднем ${ctx.nutrition.avgCaloriesPerDay} ккал/день
- Белки: ${ctx.nutrition.totalProteinG}г, жиры: ${ctx.nutrition.totalFatG}г, углеводы: ${ctx.nutrition.totalCarbsG}г
- Вода: ${ctx.nutrition.totalWaterMl} мл, в среднем ${ctx.nutrition.avgWaterMlPerDay} мл/день
- Сон: ${ctx.sleep.avgHoursPerNight != null ? ctx.sleep.avgHoursPerNight + " ч/ночь" : "нет данных"}
- Активность: ${ctx.activity.totalMinutes} мин за период, ~${ctx.activity.avgMinPerDay} мин/день
${ctx.profile ? `- Профиль: ${ctx.profile.age ?? "?"}л, ${ctx.profile.sex ?? "?"}, рост ${ctx.profile.heightCm ?? "?"}см, вес ${ctx.profile.weightKg ?? "?"}кг` : "- Профиль: не заполнен"}
${goal ? `- Цель: ${goal}` : "- Цель: не задана"}
${ctx.profile?.conditions ? `- Состояния здоровья: ${ctx.profile.conditions}` : ""}

Ответь в формате JSON:
{
  "summary": "краткое резюме состояния (2-4 предложения)",
  "advice": ["совет 1", "совет 2", "совет 3"]
}`;
}

/** Calls OpenRouter and returns a HealthReport. */
export async function generateHealthReport(input: ReportInput): Promise<HealthReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const ctx = await buildReportContext(input);
  const prompt = buildPrompt(ctx);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("OpenRouter error", { status: response.status, body: text });
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content) as { summary?: string; advice?: string[] };
    return {
      summary: parsed.summary ?? "Не удалось получить сводку.",
      advice: Array.isArray(parsed.advice) ? parsed.advice : [],
    };
  } catch {
    logger.error("Failed to parse OpenRouter response", { content });
    return { summary: content, advice: [] };
  }
}
