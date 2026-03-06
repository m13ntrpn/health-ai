import { prisma } from "@/shared/lib/prisma";
import type { UserProfile } from "@/generated/prisma/client";
import type { UserProfilePayload } from "@/features/telegram-user/schemas/userProfile";

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  return prisma.userProfile.findUnique({ where: { userId } });
}

/** Fields required for personalized reports and advice. */
const REQUIRED_FIELDS: Array<keyof UserProfile> = [
  "birthDate",
  "sex",
  "heightCm",
  "weightKg",
];

const FIELD_LABELS: Record<string, string> = {
  birthDate: "дата рождения",
  sex: "пол",
  heightCm: "рост",
  weightKg: "вес",
};

export interface ProfileCompleteness {
  isComplete: boolean;
  missingFields: string[];
}

export async function getProfileCompleteness(
  userId: string,
): Promise<ProfileCompleteness> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    return {
      isComplete: false,
      missingFields: REQUIRED_FIELDS.map((f) => FIELD_LABELS[f] ?? f),
    };
  }

  const missingFields = REQUIRED_FIELDS
    .filter((f) => profile[f] == null)
    .map((f) => FIELD_LABELS[f] ?? f);

  return { isComplete: missingFields.length === 0, missingFields };
}

function toDecimalString(
  value: number | null | undefined,
): string | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return String(value);
}

export async function upsertUserProfile(
  userId: string,
  payload: UserProfilePayload,
): Promise<UserProfile> {
  const data = {
    birthDate: payload.birthDate ?? undefined,
    sex: payload.sex,
    heightCm: payload.heightCm,
    activityLevel: payload.activityLevel,
    countryCode: payload.countryCode,
    timezone: payload.timezone,
    bloodType: payload.bloodType,
    rhFactor: payload.rhFactor,
    restingHeartRateBpm: payload.restingHeartRateBpm,
    bloodPressureSys: payload.bloodPressureSys,
    bloodPressureDia: payload.bloodPressureDia,
    smokingStatus: payload.smokingStatus,
    alcoholUse: payload.alcoholUse,
    conditions: payload.conditions,
    allergies: payload.allergies,
    intolerances: payload.intolerances,
    dietType: payload.dietType,
    goals: payload.goals,
    weightKg: toDecimalString(payload.weightKg),
    waistCm: toDecimalString(payload.waistCm),
    hipsCm: toDecimalString(payload.hipsCm),
    bodyFatPercent: toDecimalString(payload.bodyFatPercent),
    muscleMassKg: toDecimalString(payload.muscleMassKg),
    bodyWaterPercent: toDecimalString(payload.bodyWaterPercent),
    targetWeightKg: toDecimalString(payload.targetWeightKg),
    targetCalories: payload.targetCalories,
    targetProteinG: toDecimalString(payload.targetProteinG),
    targetFatG: toDecimalString(payload.targetFatG),
    targetCarbsG: toDecimalString(payload.targetCarbsG),
    targetWaterMl: payload.targetWaterMl,
    targetSteps: payload.targetSteps,
    bmrCalories: payload.bmrCalories,
    tdeeCalories: payload.tdeeCalories,
  };

  return prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // If body metrics provided, also append a measurement point (history).
    const hasAnyMeasurement =
      payload.weightKg != null ||
      payload.waistCm != null ||
      payload.hipsCm != null ||
      payload.bodyFatPercent != null ||
      payload.muscleMassKg != null;

    if (hasAnyMeasurement) {
      await tx.bodyMeasurement.create({
        data: {
          userId,
          measuredAt: new Date(),
          weightKg: toDecimalString(payload.weightKg),
          waistCm: toDecimalString(payload.waistCm),
          hipsCm: toDecimalString(payload.hipsCm),
          bodyFatPercent: toDecimalString(payload.bodyFatPercent),
          muscleMassKg: toDecimalString(payload.muscleMassKg),
        },
      });
    }

    const completeness = await getProfileCompleteness(userId);
    if (profile.onboardingCompleted !== completeness.isComplete) {
      return tx.userProfile.update({
        where: { userId },
        data: { onboardingCompleted: completeness.isComplete },
      });
    }

    return profile;
  });
}
