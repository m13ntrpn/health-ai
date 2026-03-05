export interface PeriodSummary {
  totalCalories: number;
  completedDaysCount: number;
  daysWithLogsCount: number;
}

/** Pure aggregation of logs with meals; used by getSimpleSummary and tests. */
export function aggregateLogsToSummary(
  logs: Array<{ isCompleted: boolean; meals: Array<{ calories: number | null }> }>,
): PeriodSummary {
  let totalCalories = 0;
  let completedDaysCount = 0;
  for (const log of logs) {
    if (log.isCompleted) completedDaysCount += 1;
    for (const meal of log.meals) {
      if (meal.calories != null) totalCalories += meal.calories;
    }
  }
  return {
    totalCalories,
    completedDaysCount,
    daysWithLogsCount: logs.length,
  };
}
