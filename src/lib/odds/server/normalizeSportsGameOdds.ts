import type { BookMap, GameMarkets, GameOdds, OddsTeam, PlayerProp, TotalMarket } from "@/types/odds";
import type { Sportsbook } from "../sportsbooks";
import { PROVIDER_BOOKS, PROP_MARKETS, YES_NO_PROP_MARKETS } from "./providerMapping";
import { american, isoDate, numeric, object, requiredObject, requiredString } from "./validation";
import { OddsSyncError } from "./errors";
import { weekRange } from "./weekRange";

export interface NormalizedGame extends GameOdds { sourceUpdatedAt?: string }
type SideQuote = { line: number; odds?: number };
type TotalSides = { over?: SideQuote; under?: SideQuote };
const TEAM_ALIASES: Record<string, string> = { JAC: "JAX", WSH: "WAS", LA: "LAR" };
const TEAMS = new Set("ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN NE NO NYG NYJ PHI PIT SEA SF TB TEN WAS".split(" "));

function team(value: unknown): OddsTeam {
  const raw = requiredObject(value);
  const names = requiredObject(raw.names);
  const short = requiredString(names.short).toUpperCase();
  const abbr = TEAM_ALIASES[short] ?? short;
  if (!TEAMS.has(abbr)) throw new OddsSyncError("An NFL team could not be normalized; nothing was updated.");
  return { teamId: requiredString(raw.teamID), name: requiredString(names.long), abbr };
}

function total(sides: TotalSides): TotalMarket | undefined {
  const { over, under } = sides;
  // The RANKR schema has one line per book. Never attach an under price to a
  // different over line; omit this book's market until its main lines agree.
  if (over && under && over.line !== under.line) return undefined;
  const line = over?.line ?? under?.line;
  if (line === undefined) return undefined;
  return { line, ...(over?.odds !== undefined ? { overOdds: over.odds } : {}), ...(under?.odds !== undefined ? { underOdds: under.odds } : {}) };
}

export function normalizeSportsGameOdds(events: unknown[], season: number, week: number): NormalizedGame[] {
  const range = weekRange(season, week);
  const games = new Map<string, NormalizedGame>();
  const slugs = new Set<string>();
  for (const value of events) {
    const raw = requiredObject(value);
    if (raw.leagueID !== "NFL" || raw.type !== "match") throw new OddsSyncError("SportsGameOdds returned an unexpected event; nothing was updated.");
    const eventId = requiredString(raw.eventID);
    if (!/^[A-Za-z0-9_-]{1,200}$/.test(eventId)) throw new OddsSyncError("SportsGameOdds returned an invalid event ID; nothing was updated.");
    if (games.has(eventId)) throw new OddsSyncError("SportsGameOdds returned duplicate events; please retry.");
    const status = requiredObject(raw.status);
    const startTime = isoDate(status.startsAt);
    if (!startTime) throw new OddsSyncError("SportsGameOdds returned an invalid kickoff; nothing was updated.");
    // Date filters can include a boundary event. Use half-open ranges locally.
    if (startTime < range.startsAfter || startTime >= range.startsBefore || status.cancelled === true) continue;
    const rawTeams = requiredObject(raw.teams);
    const away = team(rawTeams.away);
    const home = team(rawTeams.home);
    const slug = `${away.abbr}-${home.abbr}`.toLowerCase();
    if (slugs.has(slug)) throw new OddsSyncError("Multiple events share a weekly matchup; nothing was updated.");
    slugs.add(slug);
    const gameOdds: BookMap<GameMarkets> = {};
    const totals: Partial<Record<Sportsbook, TotalSides>> = {};
    const props = new Map<string, { prop: PlayerProp; sides: Partial<Record<Sportsbook, TotalSides>> }>();
    const players = raw.players == null ? {} : requiredObject(raw.players);
    const markets = raw.odds == null ? {} : requiredObject(raw.odds);
    if (raw.odds == null && status.oddsPresent === true) throw new OddsSyncError("SportsGameOdds omitted event markets; nothing was updated.");
    let sourceUpdatedAt: string | undefined;
    for (const marketValue of Object.values(markets)) {
      const market = requiredObject(marketValue);
      if (market.periodID !== "game" || market.cancelled === true) continue;
      const { statID, statEntityID, betTypeID, sideID } = market;
      const isTeamSide = (statEntityID === "home" || statEntityID === "away") && sideID === statEntityID;
      const gameLine = statID === "points" && ((isTeamSide && (betTypeID === "sp" || betTypeID === "ml")) || (statEntityID === "all" && betTypeID === "ou" && (sideID === "over" || sideID === "under")));
      const definition = typeof statID === "string" && Object.hasOwn(PROP_MARKETS, statID) ? PROP_MARKETS[statID as keyof typeof PROP_MARKETS] : undefined;
      const yesNoDefinition = betTypeID === "yn" && typeof statID === "string" && Object.hasOwn(YES_NO_PROP_MARKETS, statID) ? YES_NO_PROP_MARKETS[statID as keyof typeof YES_NO_PROP_MARKETS] : undefined;
      const player = typeof statEntityID === "string" ? object(players[statEntityID]) : null;
      const playerTeam = player?.teamID === away.teamId ? away.abbr : player?.teamID === home.teamId ? home.abbr : undefined;
      const isProp = definition && player && playerTeam && typeof player.name === "string" && player.name.trim() && betTypeID === "ou" && (sideID === "over" || sideID === "under");
      const isYesNoProp = yesNoDefinition && player && playerTeam && typeof player.name === "string" && player.name.trim() && (sideID === "yes" || sideID === "no");
      if (!gameLine && !isProp && !isYesNoProp) continue;
      const byBookmaker = market.byBookmaker == null ? {} : requiredObject(market.byBookmaker);
      for (const [providerBook, quoteValue] of Object.entries(byBookmaker)) {
        if (!Object.hasOwn(PROVIDER_BOOKS, providerBook)) continue;
        const book = PROVIDER_BOOKS[providerBook as keyof typeof PROVIDER_BOOKS];
        const quote = requiredObject(quoteValue);
        const updated = isoDate(quote.lastUpdatedAt);
        if (updated && (!sourceUpdatedAt || updated > sourceUpdatedAt)) sourceUpdatedAt = updated;
        // v2 retains suspended/closed prices. These must not become active odds.
        if (quote.available !== true || quote.isMainLine === false) continue;
        const odds = american(quote.odds);
        if (isYesNoProp && yesNoDefinition && playerTeam && typeof statEntityID === "string" && typeof player.name === "string" && (sideID === "yes" || sideID === "no") && odds !== undefined) {
          const key = `${statEntityID}:${yesNoDefinition.market}`;
          let entry = props.get(key);
          if (!entry) {
            entry = { prop: { playerId: statEntityID, playerName: player.name, team: playerTeam, ...yesNoDefinition, sportsbooks: {} }, sides: {} };
            props.set(key, entry);
          }
          const target = entry.prop.sportsbooks[book] ??= {};
          if (sideID === "yes") target.yesOdds = odds; else target.noOdds = odds;
        } else if (gameLine && betTypeID === "ml" && isTeamSide && odds !== undefined) {
          const target = gameOdds[book] ??= {};
          const moneyline = target.moneyline ??= {};
          if (sideID === "away") moneyline.awayOdds = odds; else moneyline.homeOdds = odds;
        } else if (gameLine && betTypeID === "sp" && isTeamSide) {
          const line = numeric(quote.spread);
          if (line === undefined) continue;
          const target = gameOdds[book] ??= {};
          const spread = target.spread ??= {};
          if (sideID === "away") { spread.awayLine = line; if (odds !== undefined) spread.awayOdds = odds; }
          else { spread.homeLine = line; if (odds !== undefined) spread.homeOdds = odds; }
        } else if (betTypeID === "ou" && (sideID === "over" || sideID === "under")) {
          const line = numeric(quote.overUnder);
          if (line === undefined) continue;
          const side: SideQuote = { line, ...(odds !== undefined ? { odds } : {}) };
          if (gameLine) (totals[book] ??= {})[sideID] = side;
          else if (isProp && definition && playerTeam && typeof statEntityID === "string" && typeof player.name === "string") {
            const key = `${statEntityID}:${definition.market}`;
            let entry = props.get(key);
            if (!entry) {
              entry = { prop: { playerId: statEntityID, playerName: player.name, team: playerTeam, ...definition, sportsbooks: {} }, sides: {} };
              props.set(key, entry);
            }
            (entry.sides[book] ??= {})[sideID] = side;
          }
        }
      }
    }
    for (const [book, sides] of Object.entries(totals)) {
      const result = total(sides);
      if (result) (gameOdds[book as Sportsbook] ??= {}).total = result;
    }
    const playerProps: PlayerProp[] = [];
    for (const entry of props.values()) {
      for (const [book, sides] of Object.entries(entry.sides)) {
        const result = total(sides);
        if (result) entry.prop.sportsbooks[book as Sportsbook] = result;
      }
      if (Object.keys(entry.prop.sportsbooks).length) playerProps.push(entry.prop);
    }
    games.set(eventId, { eventId, season, week, slug, away, home, startTime, gameOdds, playerProps,
      updatedAt: "", isMock: false, ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}) });
  }
  return [...games.values()].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.eventId.localeCompare(b.eventId));
}
