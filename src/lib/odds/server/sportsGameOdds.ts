import "server-only";
import { OddsSyncError } from "./errors";
import { PROVIDER_BOOKS, REQUESTED_ODDS } from "./providerMapping";
import { weekRange } from "./weekRange";
import { object } from "./validation";

export function requireSportsGameOddsKey(): string {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY?.trim();
  if (!apiKey) throw new OddsSyncError("SPORTSGAMEODDS_API_KEY is not configured on the server.", 503);
  return apiKey;
}

// Validate every page before writing. Partial pagination is never a snapshot.
export async function fetchNFLEvents(season: number, week: number, fetcher: typeof fetch = fetch): Promise<unknown[]> {
  const range = weekRange(season, week);
  const apiKey = requireSportsGameOddsKey();
  const events: unknown[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const url = new URL("https://api.sportsgameodds.com/v2/events");
    url.search = new URLSearchParams({ leagueID: "NFL", type: "match", ...range,
      bookmakerID: Object.keys(PROVIDER_BOOKS).join(","), oddID: REQUESTED_ODDS.join(","),
      includeAltLines: "false", includeOpposingOdds: "true", limit: "100", ...(cursor ? { cursor } : {}),
    }).toString();
    let response: Response;
    try { response = await fetcher(url, { headers: { "x-api-key": apiKey }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) }); }
    catch { throw new OddsSyncError("Unable to reach SportsGameOdds. Please try again."); }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new OddsSyncError("SportsGameOdds rejected the server key or its access level. Check the key and plan.");
      if (response.status === 429) throw new OddsSyncError("SportsGameOdds rate limit reached. Please try again later.", 429);
      throw new OddsSyncError("SportsGameOdds could not return odds. Please try again later.");
    }
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new OddsSyncError("SportsGameOdds returned malformed data; nothing was updated."); }
    const page = object(payload);
    if (!page || page.success !== true || !Array.isArray(page.data) || (page.nextCursor != null && typeof page.nextCursor !== "string")) {
      throw new OddsSyncError("SportsGameOdds returned malformed data; nothing was updated.");
    }
    events.push(...page.data);
    cursor = typeof page.nextCursor === "string" && page.nextCursor ? page.nextCursor : undefined;
    if (cursor && (cursors.has(cursor) || cursors.size >= 9)) throw new OddsSyncError("SportsGameOdds pagination was incomplete; nothing was updated.");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return events;
}
