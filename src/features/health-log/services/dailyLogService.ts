import { prisma } from "@/shared/lib/prisma";
import type { DailyLog } from "@/generated/prisma/client";
import { dateStringToDateTime } from "./dateUtils";
import type { DailyLogPayload } from "../schemas/dailyLog";
import {
  aggregateLogsToSummary,
  type PeriodSummary,
} from "./summaryUtils";

function toDecimal(value: number | null | undefined): string | undefined {
  if (value == null) return undefined;
  return String(value);
}

/**
 * Creates or updates the daily log for the given user and date.
 * Replaces existing meals, intakes, sleepLogs, and activityLogs for that day.
 */
export async function upsertDailyLog(
  userId: string,
  dateStr: string,
  payload: DailyLogPayload,
): Promise<DailyLog> {
  const date = dateStringToDateTime(dateStr);

  return prisma.$transaction(async (tx) => {
    const dailyLog = await tx.dailyLog.upsert({
      where: {
        userId_date: { userId, date },
      },
      create: {
        userId,
        date,
        mood: payload.mood ?? undefined,
        comment: payload.comment ?? undefined,
        isCompleted: payload.isCompleted ?? false,
        waterMl: payload.waterMl ?? undefined,
      },
      update: {
        mood: payload.mood ?? undefined,
        comment: payload.comment ?? undefined,
        isCompleted: payload.isCompleted ?? false,
        waterMl: payload.waterMl ?? undefined,
      },
    });

    await tx.meal.deleteMany({ where: { dailyLogId: dailyLog.id } });
    await tx.intakeItem.deleteMany({ where: { dailyLogId: dailyLog.id } });
    await tx.sleepLog.deleteMany({ where: { dailyLogId: dailyLog.id } });
    await tx.activityLog.deleteMany({ where: { dailyLogId: dailyLog.id } });

    if (payload.meals?.length) {
      await tx.meal.createMany({
        data: payload.meals.map((m) => ({
          dailyLogId: dailyLog.id,
          type: m.type ?? undefined,
          time: m.time ?? undefined,
          description: m.description ?? undefined,
          calories: m.calories ?? undefined,
          proteinG: toDecimal(m.proteinG),
          fatG: toDecimal(m.fatG),
          carbsG: toDecimal(m.carbsG),
        })),
      });
    }
    if (payload.intakes?.length) {
      await tx.intakeItem.createMany({
        data: payload.intakes.map((i) => ({
          dailyLogId: dailyLog.id,
          name: i.name,
          dose: i.dose ?? undefined,
          time: i.time ?? undefined,
          category: i.category ?? undefined,
        })),
      });
    }
    if (payload.sleepLogs?.length) {
      await tx.sleepLog.createMany({
        data: payload.sleepLogs.map((s) => ({
          dailyLogId: dailyLog.id,
          start: s.start ?? undefined,
          end: s.end ?? undefined,
          quality: s.quality ?? undefined,
        })),
      });
    }
    if (payload.activityLogs?.length) {
      await tx.activityLog.createMany({
        data: payload.activityLogs.map((a) => ({
          dailyLogId: dailyLog.id,
          type: a.type ?? undefined,
          durationMin: a.durationMin ?? undefined,
          intensity: a.intensity ?? undefined,
        })),
      });
    }

    const result = await tx.dailyLog.findUniqueOrThrow({
      where: { id: dailyLog.id },
      include: {
        meals: true,
        intakes: true,
        sleepLogs: true,
        activityLogs: true,
      },
    });

    // Persist aggregated daily summary for fast report queries
    const totalCalories = result.meals.reduce((s, m) => s + (m.calories ?? 0), 0);
    const proteinG = result.meals.reduce((s, m) => s + (m.proteinG != null ? Number(m.proteinG) : 0), 0);
    const fatG = result.meals.reduce((s, m) => s + (m.fatG != null ? Number(m.fatG) : 0), 0);
    const carbsG = result.meals.reduce((s, m) => s + (m.carbsG != null ? Number(m.carbsG) : 0), 0);

    await tx.dailySummary.upsert({
      where: { dailyLogId: dailyLog.id },
      create: {
        dailyLogId: dailyLog.id,
        totalCalories,
        proteinG: String(proteinG),
        fatG: String(fatG),
        carbsG: String(carbsG),
        waterMl: result.waterMl,
      },
      update: {
        totalCalories,
        proteinG: String(proteinG),
        fatG: String(fatG),
        carbsG: String(carbsG),
        waterMl: result.waterMl,
      },
    });

    return result;
  });
}

export async function getDailyLogByDate(
  userId: string,
  dateStr: string,
): Promise<DailyLog | null> {
  const date = dateStringToDateTime(dateStr);
  return prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      meals: true,
      intakes: true,
      sleepLogs: true,
      activityLogs: true,
    },
  });
}

export interface ListDailyLogsParams {
  userId: string;
  limit: number;
  cursor?: string | null;
}

export async function listDailyLogs(
  params: ListDailyLogsParams,
): Promise<{ logs: DailyLog[]; nextCursor: string | null }> {
  const { userId, limit, cursor } = params;
  const logs = await prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      meals: true,
      intakes: true,
      sleepLogs: true,
      activityLogs: true,
    },
  });

  const hasMore = logs.length > limit;
  const result = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? result[result.length - 1]!.id : null;

  return { logs: result, nextCursor };
}

export interface SummaryParams {
  userId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
}

/** Pure aggregation: used by getSimpleSummary and by tests. */
export { aggregateLogsToSummary } from "./summaryUtils";
export type { PeriodSummary } from "./summaryUtils";

/**
 * Aggregates calories from meals and counts completed days in the date range.
 */
export async function getSimpleSummary(
  params: SummaryParams,
): Promise<PeriodSummary> {
  const from = dateStringToDateTime(params.fromDate);
  const to = dateStringToDateTime(params.toDate);
  if (from > to) {
    return { totalCalories: 0, completedDaysCount: 0, daysWithLogsCount: 0 };
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: params.userId,
      date: { gte: from, lte: to },
    },
    include: { meals: true },
  });

  return aggregateLogsToSummary(logs);
}
