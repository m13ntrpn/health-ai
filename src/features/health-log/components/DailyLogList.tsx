"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpcClient } from "@/shared/api/trpcClient";
import { formatLogDate } from "./formatDate";

const PAGE_SIZE = 20;

type ListResult = Awaited<
  ReturnType<typeof trpcClient.healthLog.listDailyLogs.query>
>;

export function DailyLogList() {
  const [logs, setLogs] = useState<ListResult["logs"]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (cursor?: string | null) => {
    setError(null);
    try {
      const result = await trpcClient.healthLog.listDailyLogs.query({
        limit: PAGE_SIZE,
        cursor: cursor ?? undefined,
      });
      if (cursor) {
        setLogs((prev) => [...prev, ...result.logs]);
      } else {
        setLogs(result.logs);
      }
      setNextCursor(result.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && logs.length === 0) {
    return <p className="text-sm text-neutral-500">Loading…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        {error}
        <button
          type="button"
          onClick={() => load()}
          className="ml-2 underline"
        >
          Retry
        </button>
      </p>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No logs yet. Add one from a day below or via the bot.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
        {logs.map((log) => {
          const dateStr =
            typeof log.date === "string"
              ? (log.date as string).slice(0, 10)
              : new Date(log.date).toISOString().slice(0, 10);
          return (
            <li key={log.id} className="py-2">
              <Link
                href={`/logs/${dateStr}`}
                className="block rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <span className="font-medium">{formatLogDate(dateStr)}</span>
                {log.mood && (
                  <span className="ml-2 text-neutral-500">— {log.mood}</span>
                )}
                {log.isCompleted && (
                  <span className="ml-2 text-green-600 dark:text-green-400">
                    ✓
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {nextCursor && (
        <button
          type="button"
          onClick={() => load(nextCursor)}
          className="text-sm text-neutral-600 dark:text-neutral-400 underline"
        >
          Load more
        </button>
      )}
    </div>
  );
}
