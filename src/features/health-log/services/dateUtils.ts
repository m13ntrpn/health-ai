/**
 * Normalizes a YYYY-MM-DD string to start-of-day UTC for Prisma DateTime.
 */
export function dateStringToDateTime(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return d;
}
