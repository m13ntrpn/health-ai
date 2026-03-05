import { prisma } from "@/shared/lib/prisma";
import type { LabResult } from "@/generated/prisma/client";
import type { LabResultPayload } from "../schemas/labResult";

export async function addLabResult(
  userId: string,
  payload: LabResultPayload,
): Promise<LabResult> {
  return prisma.labResult.create({
    data: {
      userId,
      type: payload.type ?? undefined,
      date: payload.date ?? undefined,
      title: payload.title ?? undefined,
      rawSummary: payload.rawSummary ?? undefined,
    },
  });
}

export interface ListLabResultsResult {
  results: LabResult[];
  nextCursor: string | null;
}

export async function listLabResults(
  userId: string,
  limit: number,
  cursor?: string | null,
): Promise<ListLabResultsResult> {
  const rows = await prisma.labResult.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
  });

  const hasMore = rows.length > limit;
  const results = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? results[results.length - 1]!.id : null;

  return { results, nextCursor };
}
