/** Format YYYY-MM-DD for display using Russian locale (e.g. "5 мар. 2025"). */
export function formatLogDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00.000Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
