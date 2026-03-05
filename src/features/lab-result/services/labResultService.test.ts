import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LabResult } from "@/generated/prisma/client";

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    labResult: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/shared/lib/prisma";
import { addLabResult, listLabResults } from "./labResultService";

const mockLabResult = (overrides: Partial<LabResult> = {}): LabResult => ({
  id: "result-1",
  userId: "user-1",
  type: "blood",
  date: new Date("2026-01-15"),
  title: "CBC",
  rawSummary: "All normal",
  createdAt: new Date("2026-01-15T10:00:00Z"),
  updatedAt: new Date("2026-01-15T10:00:00Z"),
  ...overrides,
});

describe("addLabResult", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new lab result with all fields", async () => {
    const result = mockLabResult();
    vi.mocked(prisma.labResult.create).mockResolvedValue(result);

    const returned = await addLabResult("user-1", {
      type: "blood",
      date: new Date("2026-01-15"),
      title: "CBC",
      rawSummary: "All normal",
    });

    expect(prisma.labResult.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "blood",
        date: new Date("2026-01-15"),
        title: "CBC",
        rawSummary: "All normal",
      },
    });
    expect(returned).toEqual(result);
  });

  it("creates a lab result with null/undefined fields omitted", async () => {
    const result = mockLabResult({ type: undefined, date: null, title: undefined, rawSummary: undefined });
    vi.mocked(prisma.labResult.create).mockResolvedValue(result);

    await addLabResult("user-1", { type: null, date: null, title: null, rawSummary: null });

    expect(prisma.labResult.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: undefined,
        date: undefined,
        title: undefined,
        rawSummary: undefined,
      },
    });
  });
});

describe("listLabResults", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns results and null nextCursor when no more pages", async () => {
    const rows = [mockLabResult({ id: "a" }), mockLabResult({ id: "b" })];
    vi.mocked(prisma.labResult.findMany).mockResolvedValue(rows);

    const { results, nextCursor } = await listLabResults("user-1", 10);

    expect(results).toHaveLength(2);
    expect(nextCursor).toBeNull();
  });

  it("returns nextCursor when there are more results", async () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      mockLabResult({ id: `result-${i}` }),
    );
    vi.mocked(prisma.labResult.findMany).mockResolvedValue(rows);

    const { results, nextCursor } = await listLabResults("user-1", 5);

    expect(results).toHaveLength(5);
    expect(nextCursor).toBe("result-4");
  });

  it("passes cursor to prisma when provided", async () => {
    vi.mocked(prisma.labResult.findMany).mockResolvedValue([]);

    await listLabResults("user-1", 20, "cursor-id");

    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: "cursor-id" } }),
    );
  });

  it("orders by date desc then createdAt desc", async () => {
    vi.mocked(prisma.labResult.findMany).mockResolvedValue([]);

    await listLabResults("user-1", 20);

    expect(prisma.labResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
    );
  });
});
