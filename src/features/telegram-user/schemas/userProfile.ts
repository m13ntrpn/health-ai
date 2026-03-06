import { z } from "zod";

export const userProfilePayloadSchema = z.object({
  birthDate: z.coerce.date().optional().nullable(),
  sex: z.enum(["male", "female", "other"]).optional().nullable(),
  heightCm: z.number().int().min(50).max(300).optional().nullable(),
  weightKg: z.number().min(10).max(500).optional().nullable(),
  waistCm: z.number().min(30).max(300).optional().nullable(),
  hipsCm: z.number().min(30).max(300).optional().nullable(),
  bodyFatPercent: z.number().min(0).max(100).optional().nullable(),
  muscleMassKg: z.number().min(0).max(200).optional().nullable(),
  bodyWaterPercent: z.number().min(0).max(100).optional().nullable(),
  activityLevel: z.enum(["low", "medium", "high"]).optional().nullable(),
  countryCode: z.string().min(2).max(2).optional().nullable(),
  timezone: z.string().min(1).max(64).optional().nullable(),
  bloodType: z.enum(["A", "B", "AB", "O"]).optional().nullable(),
  rhFactor: z.enum(["+", "-"]).optional().nullable(),
  restingHeartRateBpm: z.number().int().min(20).max(250).optional().nullable(),
  bloodPressureSys: z.number().int().min(50).max(250).optional().nullable(),
  bloodPressureDia: z.number().int().min(30).max(200).optional().nullable(),
  smokingStatus: z
    .enum(["never", "former", "current"])
    .optional()
    .nullable(),
  alcoholUse: z
    .enum(["none", "rare", "moderate", "high"])
    .optional()
    .nullable(),
  conditions: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  intolerances: z.string().optional().nullable(),
  dietType: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
  targetWeightKg: z.number().min(10).max(500).optional().nullable(),
  targetCalories: z.number().int().min(0).max(20000).optional().nullable(),
  targetProteinG: z.number().min(0).max(2000).optional().nullable(),
  targetFatG: z.number().min(0).max(2000).optional().nullable(),
  targetCarbsG: z.number().min(0).max(3000).optional().nullable(),
  targetWaterMl: z.number().int().min(0).max(20000).optional().nullable(),
  targetSteps: z.number().int().min(0).max(200000).optional().nullable(),
  bmrCalories: z.number().int().min(0).max(20000).optional().nullable(),
  tdeeCalories: z.number().int().min(0).max(20000).optional().nullable(),
});

export type UserProfilePayload = z.infer<typeof userProfilePayloadSchema>;
