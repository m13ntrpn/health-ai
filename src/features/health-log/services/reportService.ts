import { prisma } from "@/shared/lib/prisma";
import { dateStringToDateTime } from "./dateUtils";

export interface ReportInput {
  userId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
}

/** Aggregated health data for a period. Used as LLM context by OpenClaw. */
export interface ReportContext {
  period: {
    from: string;
    to: string;
    daysWithLogs: number;
    completedDays: number;
  };
  nutrition: {
    totalCalories: number;
    avgCaloriesPerDay: number;
    totalProteinG: number;
    totalFatG: number;
    totalCarbsG: number;
    totalWaterMl: number;
    avgWaterMlPerDay: number;
  };
  sleep: {
    avgHoursPerNight: number | null;
  };
  activity: {
    totalMinutes: number;
    avgMinPerDay: number;
  };
  profile: {
    birthDate: string | null;
    ageYears: number | null;
    sex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    goals: string | null;
    conditions: string | null;
    activityLevel: string | null;
    countryCode: string | null;
    timezone: string | null;
    bloodType: string | null;
    rhFactor: string | null;
    restingHeartRateBpm: number | null;
    bloodPressureSys: number | null;
    bloodPressureDia: number | null;
    smokingStatus: string | null;
    alcoholUse: string | null;
    allergies: string | null;
    intolerances: string | null;
    dietType: string | null;
    targets: {
      targetWeightKg: number | null;
      targetCalories: number | null;
      targetProteinG: number | null;
      targetFatG: number | null;
      targetCarbsG: number | null;
      targetWaterMl: number | null;
      targetSteps: number | null;
    };
    metabolism: {
      bmrCalories: number | null;
      tdeeCalories: number | null;
    };
    onboardingCompleted: boolean;
  } | null;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeAgeYears(birthDate: Date, now: Date = new Date()): number {
  let years = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = now.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    years -= 1;
  }
  return years;
}

/** Aggregates health data for a period into a context object. */
export async function getReportContext(input: ReportInput): Promise<ReportContext> {
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
    period: {
      from: input.fromDate,
      to: input.toDate,
      daysWithLogs: daysCount,
      completedDays,
    },
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
          birthDate: profile.birthDate ? toIsoDate(profile.birthDate) : null,
          ageYears: profile.birthDate ? computeAgeYears(profile.birthDate) : null,
          sex: profile.sex,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg != null ? Number(profile.weightKg) : null,
          goals: profile.goals,
          conditions: profile.conditions,
          activityLevel: profile.activityLevel,
          countryCode: profile.countryCode,
          timezone: profile.timezone,
          bloodType: profile.bloodType,
          rhFactor: profile.rhFactor,
          restingHeartRateBpm: profile.restingHeartRateBpm,
          bloodPressureSys: profile.bloodPressureSys,
          bloodPressureDia: profile.bloodPressureDia,
          smokingStatus: profile.smokingStatus,
          alcoholUse: profile.alcoholUse,
          allergies: profile.allergies,
          intolerances: profile.intolerances,
          dietType: profile.dietType,
          targets: {
            targetWeightKg: profile.targetWeightKg != null ? Number(profile.targetWeightKg) : null,
            targetCalories: profile.targetCalories,
            targetProteinG: profile.targetProteinG != null ? Number(profile.targetProteinG) : null,
            targetFatG: profile.targetFatG != null ? Number(profile.targetFatG) : null,
            targetCarbsG: profile.targetCarbsG != null ? Number(profile.targetCarbsG) : null,
            targetWaterMl: profile.targetWaterMl,
            targetSteps: profile.targetSteps,
          },
          metabolism: {
            bmrCalories: profile.bmrCalories,
            tdeeCalories: profile.tdeeCalories,
          },
          onboardingCompleted: profile.onboardingCompleted,
        }
      : null,
  };
}
