/**
 * Knowledge base: рекомендации по здоровью для подмешивания в контекст LLM.
 * Копировать в проект OpenClaw (например src/knowledge/healthGuidelines.ts).
 */

export const healthGuidelines = {
  sleep: {
    adults: "7-9 часов",
    short: "менее 7 часов может снижать концентрацию и иммунитет",
  },
  water: {
    recommended: "30-35 мл на кг веса в день",
    note: "при активности и жаре — больше",
  },
  activity: {
    who: "150 минут умеренной активности в неделю или 75 минут интенсивной",
    steps: "около 7000-10000 шагов в день для общей активности",
  },
  nutrition: {
    balance: "сбалансированное соотношение белков, жиров и углеводов по целям",
  },
} as const;

/**
 * Возвращает текстовый блок с рекомендациями для вставки в системный промпт или контекст.
 */
export function getHealthGuidelinesText(): string {
  const g = healthGuidelines;
  return [
    "СПРАВОЧНЫЕ РЕКОМЕНДАЦИИ (для контекста, не выдумывать от себя):",
    `Сон: ${g.sleep.adults}. ${g.sleep.short}.`,
    `Вода: ${g.water.recommended}. ${g.water.note}.`,
    `Активность (ВОЗ): ${g.activity.who}. Шаги: ${g.activity.steps}.`,
    `Питание: ${g.nutrition.balance}.`,
  ].join("\n");
}
