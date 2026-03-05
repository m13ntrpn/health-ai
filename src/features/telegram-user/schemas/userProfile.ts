import { z } from "zod";

export const userProfilePayloadSchema = z.object({
  age: z.number().int().min(1).max(120).optional().nullable(),
  sex: z.enum(["male", "female", "other"]).optional().nullable(),
  heightCm: z.number().int().min(50).max(300).optional().nullable(),
  weightKg: z.number().min(10).max(500).optional().nullable(),
  waistCm: z.number().min(30).max(300).optional().nullable(),
  hipsCm: z.number().min(30).max(300).optional().nullable(),
  bodyFatPercent: z.number().min(0).max(100).optional().nullable(),
  muscleMassKg: z.number().min(0).max(200).optional().nullable(),
  bodyWaterPercent: z.number().min(0).max(100).optional().nullable(),
  activityLevel: z.enum(["low", "medium", "high"]).optional().nullable(),
  conditions: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
});

export type UserProfilePayload = z.infer<typeof userProfilePayloadSchema>;
