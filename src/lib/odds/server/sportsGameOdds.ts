import "server-only";
import { OddsSyncError } from "./errors";
import { PROVIDER_BOOKS, REQUESTED_ODDS } from "./providerMapping";
import { weekRange } from "./weekRange";
import { object } from "./validation";
import { SPORTSBOOKS, type Sportsbook } from "../sportsbooks";

export function requireSportsGameOddsKey(): string {
  const apiKey = process.env.SPORTSGAMEODDS_API_KEY?.trim();
  if (!apiKey) throw new OddsSyncError("SPORTSGAMEODDS_API_KEY is not configured on the server.", 503);
  return apiKey;
}

// Validate every page before writing. Partial pagination is never a snapshot.
export async function fetchNFLEvents(season: number, week: number, fetcher: typeof fetch = fetch, onUnavailableBook?: (book: Sportsbook) => void): Promise<unknown[]> {
  const range = weekRange(season, week);
  const apiKey = requireSportsGameOddsKey();
  const events: unknown[] = [];
  const cursors = new Set<string>();
  let books = Object.keys(PROVIDER_BOOKS) as (keyof typeof PROVIDER_BOOKS)[];
  let cursor: string | undefined;
  for (;;) {
    const url = new URL("https://api.sportsgameodds.com/v2/events");
    url.search = new URLSearchParams({ leagueID: "NFL", type: "match", ...range,
      bookmakerID: books.join(","), oddID: REQUESTED_ODDS.join(","),
      includeAltLines: "false", includeOpposingOdds: "true", limit: "100", ...(cursor ? { cursor } : {}),
    }).toString();
    let response: Response;
    try { response = await fetcher(url, { headers: { "x-api-key": apiKey }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) }); }
    catch { throw new OddsSyncError("Unable to reach SportsGameOdds. Please try again."); }
    if (!response.ok) {
      // Some plans report a restricted bookmaker as 400, not 403. Only act on
      // this specific provider message; never forward arbitrary upstream text.
      const failure = object(await response.json().catch(() => null));
      const restricted = typeof failure?.error === "string"
        ? /^The bookmakerID ([a-z0-9_]+) is unavailable at your current subscription tier\./.exec(failure.error)?.[1] : undefined;
      const excluded = books.find(book => book === restricted);
      if ((response.status === 400 || response.status === 403) && excluded) {
        if (events.length || cursor) throw new OddsSyncError(`${SPORTSBOOKS[PROVIDER_BOOKS[excluded]].name} is unavailable on your SportsGameOdds plan. Retry to fetch a consistent snapshot.`);
        books = books.filter(book => book !== excluded);
        onUnavailableBook?.(PROVIDER_BOOKS[excluded]);
        if (!books.length) throw new OddsSyncError("None of the supported sportsbooks are available on your SportsGameOdds plan.");
        continue;
      }
      if (response.status === 401 || response.status === 403) throw new OddsSyncError("SportsGameOdds rejected the server key or its access level. Check the key and plan.");
      if (response.status === 429) throw new OddsSyncError("SportsGameOdds rate limit reached. Please try again later.", 429);
      if (response.status === 400) throw new OddsSyncError("SportsGameOdds rejected the odds request (HTTP 400). Check the requested markets, date range, and subscription coverage.");
      throw new OddsSyncError(`SportsGameOdds could not return odds (HTTP ${response.status}). Please try again later.`);
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
    if (!cursor) break;
  }
  return events;
}
