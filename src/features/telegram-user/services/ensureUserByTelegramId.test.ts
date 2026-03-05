import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@/generated/prisma/client";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

const { ensureUserByTelegramId } = await import("./ensureUserByTelegramId");

const fakeUser = (id: string): User => ({
  id: "user-1",
  telegramUserId: id,
  createdAt: new Date(),
});

describe("ensureUserByTelegramId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing user if found by findUnique", async () => {
    const user = fakeUser("tg-123");
    mockFindUnique.mockResolvedValueOnce(user);

    const result = await ensureUserByTelegramId("tg-123");

    expect(result).toEqual(user);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a new user if not found", async () => {
    const user = fakeUser("tg-new");
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce(user);

    const result = await ensureUserByTelegramId("tg-new");

    expect(mockCreate).toHaveBeenCalledWith({ data: { telegramUserId: "tg-new" } });
    expect(result).toEqual(user);
  });

  it("retries findUnique and returns user on P2002 concurrent insert", async () => {
    const user = fakeUser("tg-race");
    mockFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(user);
    mockCreate.mockRejectedValueOnce({ code: "P2002" });

    const result = await ensureUserByTelegramId("tg-race");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(result).toEqual(user);
  });

  it("rethrows errors that are not P2002", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(ensureUserByTelegramId("tg-err")).rejects.toThrow("DB connection lost");
  });
});
