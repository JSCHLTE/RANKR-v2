import type { BookMap, GameMarkets, OddsPreferences, TotalMarket } from "@/types/odds";
import type { Sportsbook } from "./sportsbooks";

const finite = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value);
export function americanToProbability(odds: number): number | null {
  if (!finite(odds) || Math.abs(odds) < 100) return null;
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}
export function probabilityToAmerican(probability: number): number | null {
  if (!finite(probability) || probability <= 0 || probability >= 1) return null;
  return Math.round(probability <= 0.5 ? 100 * (1 - probability) / probability : -100 * probability / (1 - probability));
}
export function calculateConsensusOdds(values: (number | null | undefined)[]): number | null {
  const probabilities = values.filter(finite).map(americanToProbability).filter(finite);
  return probabilities.length ? probabilityToAmerican(probabilities.reduce((a, b) => a + b, 0) / probabilities.length) : null;
}
export function calculateMedianLine(values: (number | null | undefined)[]): number | null {
  const lines = values.filter(finite).sort((a, b) => a - b);
  const middle = Math.floor(lines.length / 2);
  return lines.length ? lines.length % 2 ? lines[middle] : (lines[middle - 1] + lines[middle]) / 2 : null;
}
export function consensusLine(values: { line?: number | null; odds?: number | null }[]) {
  const available = values.filter(value => finite(value.line));
  const line = calculateMedianLine(available.map(value => value.line));
  // Different lines represent different bets. Only combine prices if every available line agrees.
  const odds = line !== null && available.every(value => value.line === line)
    ? calculateConsensusOdds(available.map(value => value.odds)) : null;
  return { line, odds };
}
export function consensusTotal(books: BookMap<TotalMarket>, selected: Sportsbook[]): TotalMarket {
  const values = selected.flatMap(book => books[book] ? [books[book]!] : []);
  const over = consensusLine(values.map(value => ({ line: value.line, odds: value.overOdds })));
  const under = consensusLine(values.map(value => ({ line: value.line, odds: value.underOdds })));
  return { line: over.line, overOdds: over.odds, underOdds: under.odds };
}
export function selectGameMarkets(books: BookMap<GameMarkets>, preferences: OddsPreferences): GameMarkets {
  if (preferences.mode === "sportsbook") return books[preferences.sportsbook] ?? {};
  const values = preferences.includedBooks.flatMap(book => books[book] ? [books[book]!] : []);
  const away = consensusLine(values.map(value => ({ line: value.spread?.awayLine, odds: value.spread?.awayOdds })));
  const home = consensusLine(values.map(value => ({ line: value.spread?.homeLine, odds: value.spread?.homeOdds })));
  return {
    spread: { awayLine: away.line, awayOdds: away.odds, homeLine: home.line, homeOdds: home.odds },
    total: consensusTotal(Object.fromEntries(preferences.includedBooks.map(book => [book, books[book]?.total])), preferences.includedBooks),
    moneyline: { awayOdds: calculateConsensusOdds(values.map(value => value.moneyline?.awayOdds)), homeOdds: calculateConsensusOdds(values.map(value => value.moneyline?.homeOdds)) },
  };
}
