import { OddsSyncError } from "./errors";

// Verified 2026 kickoff: https://www.nfl.com/schedules/2026/by-week/reg-1
// Wednesday boundaries include the Wednesday opener and Tuesday reschedules.
// Explicit anchors avoid silently guessing future seasons or playoff dates.
const SEASON_STARTS: Record<number, string> = { 2026: "2026-09-09" };
export function weekRange(season: number, week: number) {
  if (!Number.isInteger(season) || !SEASON_STARTS[season] || !Number.isInteger(week) || week < 1 || week > 18) {
    throw new OddsSyncError("Sync supports the 2026 regular season, Weeks 1–18.", 400);
  }
  function boundary(days: number) {
    const noon = new Date(`${SEASON_STARTS[season]}T12:00:00Z`);
    noon.setUTCDate(noon.getUTCDate() + days);
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(noon));
    return `${noon.toISOString().slice(0, 10)}T${String(12 - hour).padStart(2, "0")}:00:00.000Z`;
  }
  return { startsAfter: boundary((week - 1) * 7), startsBefore: boundary(week * 7) };
}
