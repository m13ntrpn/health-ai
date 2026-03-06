import { z } from "zod";

/** YYYY-MM-DD date string for daily log key. */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const mealPayloadSchema = z.object({
  type: z
    .enum(["breakfast", "lunch", "dinner", "snack", "other"])
    .optional()
    .nullable(),
  time: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  calories: z.number().int().optional().nullable(),
  proteinG: z.number().optional().nullable(),
  fatG: z.number().optional().nullable(),
  carbsG: z.number().optional().nullable(),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .nullable(),
});

export const intakeItemPayloadSchema = z.object({
  name: z.string(),
  dose: z.string().optional().nullable(),
  time: z.coerce.date().optional().nullable(),
  category: z
    .enum(["vitamin", "medicine", "other"])
    .optional()
    .nullable(),
});

export const sleepLogPayloadSchema = z.object({
  start: z.coerce.date().optional().nullable(),
  end: z.coerce.date().optional().nullable(),
  quality: z.string().optional().nullable(),
});

export const activityLogPayloadSchema = z.object({
  type: z.string().optional().nullable(),
  durationMin: z.number().int().optional().nullable(),
  intensity: z
    .enum(["low", "medium", "high"])
    .optional()
    .nullable(),
});

export const dailyLogPayloadSchema = z.object({
  mood: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
  waterMl: z.number().int().min(0).optional().nullable(),
  energyLevel: z.number().int().min(1).max(5).optional().nullable(),
  stressLevel: z.number().int().min(1).max(5).optional().nullable(),
  meals: z.array(mealPayloadSchema).optional().default([]),
  intakes: z.array(intakeItemPayloadSchema).optional().default([]),
  sleepLogs: z.array(sleepLogPayloadSchema).optional().default([]),
  activityLogs: z.array(activityLogPayloadSchema).optional().default([]),
});

export type DateString = z.infer<typeof dateStringSchema>;
export type MealPayload = z.infer<typeof mealPayloadSchema>;
export type IntakeItemPayload = z.infer<typeof intakeItemPayloadSchema>;
export type SleepLogPayload = z.infer<typeof sleepLogPayloadSchema>;
export type ActivityLogPayload = z.infer<typeof activityLogPayloadSchema>;
export type DailyLogPayload = z.infer<typeof dailyLogPayloadSchema>;
