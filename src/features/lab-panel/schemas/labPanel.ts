import { z } from "zod";

export const labMetricPayloadSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string(),
  value: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  refLow: z.number().optional().nullable(),
  refHigh: z.number().optional().nullable(),
  flag: z.string().optional().nullable(), // e.g. "low" | "high" | "normal"
  meta: z.unknown().optional().nullable(),
});

export const labPanelPayloadSchema = z.object({
  name: z.string(),
  type: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  labResultId: z.string().optional().nullable(),
  metrics: z.array(labMetricPayloadSchema).default([]),
});

export type LabMetricPayload = z.infer<typeof labMetricPayloadSchema>;
export type LabPanelPayload = z.infer<typeof labPanelPayloadSchema>;

