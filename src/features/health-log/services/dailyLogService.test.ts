import { describe, it, expect } from "vitest";
import { aggregateLogsToSummary } from "./summaryUtils";

describe("aggregateLogsToSummary", () => {
  it("returns zeros for empty logs", () => {
    const result = aggregateLogsToSummary([]);
    expect(result).toEqual({
      totalCalories: 0,
      completedDaysCount: 0,
      daysWithLogsCount: 0,
    });
  });

  it("sums calories from meals", () => {
    const result = aggregateLogsToSummary([
      {
        isCompleted: false,
        meals: [{ calories: 100 }, { calories: 250 }],
      },
      {
        isCompleted: true,
        meals: [{ calories: 400 }],
      },
    ]);
    expect(result.totalCalories).toBe(750);
    expect(result.daysWithLogsCount).toBe(2);
    expect(result.completedDaysCount).toBe(1);
  });

  it("ignores null calories", () => {
    const result = aggregateLogsToSummary([
      {
        isCompleted: false,
        meals: [{ calories: 100 }, { calories: null }, { calories: 50 }],
      },
    ]);
    expect(result.totalCalories).toBe(150);
  });

  it("counts a log with no meals as a day with a log", () => {
    const result = aggregateLogsToSummary([{ isCompleted: false, meals: [] }]);
    expect(result.daysWithLogsCount).toBe(1);
    expect(result.totalCalories).toBe(0);
  });

  it("handles multiple logs where some have null calories", () => {
    const result = aggregateLogsToSummary([
      { isCompleted: true, meals: [{ calories: null }, { calories: null }] },
      { isCompleted: false, meals: [{ calories: 300 }] },
    ]);
    expect(result.totalCalories).toBe(300);
    expect(result.daysWithLogsCount).toBe(2);
  });

  it("counts completedDaysCount correctly with mixed isCompleted values", () => {
    const result = aggregateLogsToSummary([
      { isCompleted: true, meals: [] },
      { isCompleted: false, meals: [] },
      { isCompleted: true, meals: [] },
      { isCompleted: false, meals: [] },
    ]);
    expect(result.completedDaysCount).toBe(2);
    expect(result.daysWithLogsCount).toBe(4);
  });

  it("treats zero calorie meals as 0, not null", () => {
    const result = aggregateLogsToSummary([
      { isCompleted: false, meals: [{ calories: 0 }, { calories: 200 }] },
    ]);
    expect(result.totalCalories).toBe(200);
  });
});
