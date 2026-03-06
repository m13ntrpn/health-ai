import { prisma } from "@/shared/lib/prisma";
import type { BodyMeasurement } from "@/generated/prisma/client";
import type { BodyMeasurementPayload } from "../schemas/bodyMeasurement";

export interface ListBodyMeasurementsResult {
  measurements: BodyMeasurement[];
  nextCursor: string | null;
}

export async function addBodyMeasurement(
  userId: string,
  payload: BodyMeasurementPayload,
): Promise<BodyMeasurement> {
  const measuredAt = payload.measuredAt ?? new Date();
  return prisma.bodyMeasurement.create({
    data: {
      userId,
      measuredAt,
      weightKg: payload.weightKg != null ? String(payload.weightKg) : undefined,
      waistCm: payload.waistCm != null ? String(payload.waistCm) : undefined,
      hipsCm: payload.hipsCm != null ? String(payload.hipsCm) : undefined,
      bodyFatPercent:
        payload.bodyFatPercent != null ? String(payload.bodyFatPercent) : undefined,
      muscleMassKg:
        payload.muscleMassKg != null ? String(payload.muscleMassKg) : undefined,
    },
  });
}

export async function listBodyMeasurements(
  userId: string,
  limit: number,
  cursor?: string | null,
): Promise<ListBodyMeasurementsResult> {
  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { measuredAt: "desc" },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const hasMore = rows.length > limit;
  const measurements = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? measurements[measurements.length - 1]!.id : null;

  return { measurements, nextCursor };
}

