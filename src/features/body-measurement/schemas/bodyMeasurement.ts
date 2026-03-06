import { z } from "zod";

export const bodyMeasurementPayloadSchema = z.object({
  measuredAt: z.coerce.date().optional().nullable(),
  weightKg: z.number().min(10).max(500).optional().nullable(),
  waistCm: z.number().min(30).max(300).optional().nullable(),
  hipsCm: z.number().min(30).max(300).optional().nullable(),
  bodyFatPercent: z.number().min(0).max(100).optional().nullable(),
  muscleMassKg: z.number().min(0).max(200).optional().nullable(),
  bodyWaterPercent: z.number().min(0).max(100).optional().nullable(),
});

export type BodyMeasurementPayload = z.infer<typeof bodyMeasurementPayloadSchema>;

