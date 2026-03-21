/** Returns today as YYYY-MM-DD in local time */
export function today(): string {
  const d = new Date();
  return toISODate(d);
}

/** Returns the ISO date string of the most recent Saturday (or today if today is Saturday) */
export function getCurrentWeekSaturday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 6=Sat
  const diff = day === 6 ? 0 : day + 1; // days to subtract to reach Saturday
  d.setDate(d.getDate() - diff);
  return toISODate(d);
}

/** Days between two YYYY-MM-DD strings (a - b, positive if a is later) */
export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay);
}

/** Days from dateStr to today (positive = in the past) */
export function daysSince(dateStr: string): number {
  return daysBetween(today(), dateStr);
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
