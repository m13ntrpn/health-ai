/**
 * Context builder: превращает сырые данные API nadin-health в компактный текст для LLM.
 * Копировать в проект OpenClaw (например src/agent/contextBuilder.ts).
 */

interface ReportContext {
  period?: { from: string; to: string; daysWithLogs: number; completedDays: number };
  nutrition?: {
    totalCalories: number;
    avgCaloriesPerDay: number;
    totalProteinG: number;
    totalFatG: number;
    totalCarbsG: number;
    totalWaterMl: number;
    avgWaterMlPerDay: number;
  };
  sleep?: { avgHoursPerNight: number | null };
  activity?: {
    totalMinutes: number;
    avgMinPerDay: number;
    avgEnergyLevel: number | null;
    avgStressLevel: number | null;
  };
  profile?: {
    birthDate: string | null;
    ageYears: number | null;
    sex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    goals: string | null;
    targets?: Record<string, number | null>;
    [key: string]: unknown;
  } | null;
  labs?: { panels: unknown[] };
  [key: string]: unknown;
}

/**
 * Собирает из ответа getReport (и при необходимости профиля) читаемый блок DATA CONTEXT для промпта.
 */
export function buildContextFromReport(report: ReportContext): string {
  const lines: string[] = ["--- DATA CONTEXT ---"];

  if (report.profile) {
    const p = report.profile;
    lines.push("ПРОФИЛЬ:");
    if (p.ageYears != null) lines.push(`Возраст: ${p.ageYears}`);
    if (p.sex) lines.push(`Пол: ${p.sex}`);
    if (p.heightCm != null) lines.push(`Рост: ${p.heightCm} см`);
    if (p.weightKg != null) lines.push(`Вес: ${p.weightKg} кг`);
    if (p.goals) lines.push(`Цель: ${p.goals}`);
    if (p.targets) {
      const t = p.targets;
      if (t.targetWeightKg != null) lines.push(`Целевой вес: ${t.targetWeightKg} кг`);
      if (t.targetCalories != null) lines.push(`Целевые калории: ${t.targetCalories}`);
      if (t.targetWaterMl != null) lines.push(`Целевая вода: ${t.targetWaterMl} мл`);
    }
  }

  if (report.period) {
    lines.push("");
    lines.push(`ПЕРИОД: ${report.period.from} — ${report.period.to}`);
    lines.push(`Дней с записями: ${report.period.daysWithLogs}, завершённых: ${report.period.completedDays}`);
  }

  if (report.nutrition) {
    const n = report.nutrition;
    lines.push("");
    lines.push("ПИТАНИЕ (за период):");
    lines.push(`Калории: среднее ${n.avgCaloriesPerDay}/день, всего ${n.totalCalories}`);
    lines.push(`Белки: ${n.totalProteinG} г, жиры: ${n.totalFatG} г, углеводы: ${n.totalCarbsG} г`);
    lines.push(`Вода: среднее ${n.avgWaterMlPerDay} мл/день, всего ${n.totalWaterMl} мл`);
  }

  if (report.sleep?.avgHoursPerNight != null) {
    lines.push("");
    lines.push(`СОН: в среднем ${report.sleep.avgHoursPerNight} ч за ночь`);
  }

  if (report.activity) {
    const a = report.activity;
    lines.push("");
    lines.push("АКТИВНОСТЬ:");
    lines.push(`Всего минут: ${a.totalMinutes}, в среднем ${a.avgMinPerDay} мин/день`);
    if (a.avgEnergyLevel != null) lines.push(`Средний уровень энергии (1-5): ${a.avgEnergyLevel}`);
    if (a.avgStressLevel != null) lines.push(`Средний уровень стресса (1-5): ${a.avgStressLevel}`);
  }

  if (report.labs?.panels?.length) {
    lines.push("");
    lines.push("ЛАБОРАТОРНЫЕ ПАНЕЛИ: есть структурированные данные (см. JSON при необходимости).");
  }

  lines.push("--- END DATA CONTEXT ---");
  return lines.join("\n");
}

/**
 * Собирает минимальный контекст из профиля (для ответов без отчёта).
 */
export function buildContextFromProfile(profile: ReportContext["profile"]): string {
  if (!profile) return "--- DATA CONTEXT ---\nДанных профиля нет.\n--- END DATA CONTEXT ---";
  return buildContextFromReport({ profile });
}
