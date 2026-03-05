import { z } from "zod";

export const labResultPayloadSchema = z.object({
  type: z.string().optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  title: z.string().optional().nullable(),
  rawSummary: z.string().optional().nullable(),
});

export type LabResultPayload = z.infer<typeof labResultPayloadSchema>;
