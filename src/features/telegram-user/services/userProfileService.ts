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
  "age",
  "sex",
  "heightCm",
  "weightKg",
  "goals",
];

const FIELD_LABELS: Record<string, string> = {
  age: "возраст",
  sex: "пол",
  heightCm: "рост",
  weightKg: "вес",
  goals: "цель",
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
    age: payload.age,
    sex: payload.sex,
    heightCm: payload.heightCm,
    activityLevel: payload.activityLevel,
    conditions: payload.conditions,
    goals: payload.goals,
    weightKg: toDecimalString(payload.weightKg),
    waistCm: toDecimalString(payload.waistCm),
    hipsCm: toDecimalString(payload.hipsCm),
    bodyFatPercent: toDecimalString(payload.bodyFatPercent),
    muscleMassKg: toDecimalString(payload.muscleMassKg),
    bodyWaterPercent: toDecimalString(payload.bodyWaterPercent),
  };

  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
