import "server-only";
import { SPORTSBOOK_IDS } from "../sportsbooks";
import { fetchNFLEvents, requireSportsGameOddsKey } from "./sportsGameOdds";
import { normalizeSportsGameOdds } from "./normalizeSportsGameOdds";
import { currentRevision, publishSnapshot } from "./store";
import { weekRange } from "./weekRange";
import { OddsSyncError } from "./errors";

export async function syncOdds(season: number, week: number) {
  weekRange(season, week);
  requireSportsGameOddsKey();
  // Capture before the remote fetch so a slower sync cannot overwrite a newer one.
  const revision = await currentRevision(season, week);
  const events = await fetchNFLEvents(season, week);
  if (!events.length) throw new OddsSyncError("No NFL events returned for this week. Existing odds were left unchanged.", 422);
  const games = normalizeSportsGameOdds(events, season, week);
  const updatedAt = await publishSnapshot(season, week, games, revision);
  const sportsbooksFound = SPORTSBOOK_IDS.filter(book => games.some(game => game.gameOdds[book] || game.playerProps.some(prop => prop.sportsbooks[book])));
  return { success: true, season, week, gamesFetched: events.length, gamesWritten: games.length,
    propsWritten: games.reduce((sum, game) => sum + game.playerProps.length, 0), sportsbooksFound, updatedAt };
}
