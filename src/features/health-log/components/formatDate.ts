/** Format YYYY-MM-DD for display (e.g. "5 Mar 2025"). */
export function formatLogDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00.000Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
