import { prisma } from "@/shared/lib/prisma";
import type { LabPanel, LabMetric } from "@/generated/prisma/client";
import type { LabPanelPayload, LabMetricPayload } from "../schemas/labPanel";

export interface ListLabPanelsResult {
  panels: (LabPanel & { metrics: LabMetric[] })[];
  nextCursor: string | null;
}

export async function addLabPanel(
  userId: string,
  payload: LabPanelPayload,
): Promise<LabPanel & { metrics: LabMetric[] }> {
  return prisma.labPanel.create({
    data: {
      userId,
      name: payload.name,
      type: payload.type ?? undefined,
      date: payload.date ?? undefined,
      labResultId: payload.labResultId ?? undefined,
      metrics: {
        create: payload.metrics.map((m: LabMetricPayload) => ({
          code: m.code ?? undefined,
          name: m.name,
          value: m.value != null ? String(m.value) : undefined,
          unit: m.unit ?? undefined,
          refLow: m.refLow != null ? String(m.refLow) : undefined,
          refHigh: m.refHigh != null ? String(m.refHigh) : undefined,
          flag: m.flag ?? undefined,
          meta: m.meta ?? undefined,
        })),
      },
    },
    include: { metrics: true },
  });
}

export async function listLabPanels(
  userId: string,
  limit: number,
  cursor?: string | null,
): Promise<ListLabPanelsResult> {
  const rows = await prisma.labPanel.findMany({
    where: { userId },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    include: { metrics: true },
  });

  const hasMore = rows.length > limit;
  const panels = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? panels[panels.length - 1]!.id : null;

  return { panels, nextCursor };
}

