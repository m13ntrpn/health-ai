import { z } from "zod";

export const medicationPlanPayloadSchema = z.object({
  name: z.string().min(1),
  dose: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export type MedicationPlanPayload = z.infer<typeof medicationPlanPayloadSchema>;

