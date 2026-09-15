import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { americanToProbability, probabilityToAmerican, calculateConsensusOdds, calculateMedianLine, consensusLine, consensusTotal, selectGameMarkets } from "./consensus";
import { SPORTSBOOK_IDS } from "./sportsbooks";
import type { GameOdds, WeekOdds } from "../../types/odds";

test("American odds average through probability, not numeric prices", () => {
  assert.equal(americanToProbability(-200), 2 / 3);
  assert.equal(americanToProbability(200), 1 / 3);
  assert.equal(probabilityToAmerican(0.5), 100);
  assert.equal(calculateConsensusOdds([-200, 200]), 100);
  assert.equal(calculateConsensusOdds([null, undefined, 0, NaN]), null);
  assert.equal(probabilityToAmerican(1), null);
  assert.equal(probabilityToAmerican(0), null);
});
test("median resists outliers and preserves zero lines", () => {
  assert.equal(calculateMedianLine([264.5, 265.5, 266.5, 267.5, 278.5]), 266.5);
  assert.equal(calculateMedianLine([3, 4, undefined]), 3.5);
  assert.equal(calculateMedianLine([null, 0]), 0);
  assert.equal(calculateMedianLine([]), null);
});
test("different prop lines have no combined price, matching lines do", () => {
  assert.deepEqual(consensusLine([{ line: 265.5, odds: -120 }, { line: 267.5, odds: -110 }, { line: 266.5, odds: -115 }]), { line: 266.5, odds: null });
  assert.deepEqual(consensusLine([{ line: 3, odds: -110 }, { line: 3, odds: -110 }, { line: null, odds: -150 }]), { line: 3, odds: -110 });
  assert.deepEqual(consensusTotal({ draftkings: { line: 1.5, overOdds: -110 }, fanduel: { line: 1.5, underOdds: 100 } }, ["draftkings", "fanduel"]), { line: 1.5, overOdds: -110, underOdds: 100 });
});
test("fixtures agree with weekly summaries and unavailable books never contribute zeros", () => {
  const week: WeekOdds = JSON.parse(readFileSync("public/data/odds/2026/week-1/games.json", "utf8"));
  assert.equal(week.games.length, 3);
  for (const summary of week.games) {
    const game: GameOdds = JSON.parse(readFileSync(`public/data/odds/2026/week-1/${summary.slug.toUpperCase()}.json`, "utf8"));
    assert.deepEqual(summary.sportsbooks, game.gameOdds);
    assert.equal(summary.eventId, game.eventId);
    assert.equal(game.season, week.season);
    assert.equal(game.week, week.week);
    assert.ok(game.playerProps.length);
    assert.ok(Object.keys(game.gameOdds).every(book => SPORTSBOOK_IDS.some(id => id === book)));
  }
  const partial = week.games[2].sportsbooks;
  const preferences = { mode: "consensus" as const, sportsbook: "draftkings" as const, includedBooks: ["espnbet", "caesars"] as typeof SPORTSBOOK_IDS };
  const result = selectGameMarkets(partial, preferences);
  assert.equal(result.total?.line, null);
  assert.equal(result.spread?.awayLine, -2.5);
  assert.equal(result.spread?.awayOdds, null);
  assert.equal(result.moneyline?.homeOdds, null);
  assert.deepEqual(selectGameMarkets(partial, { ...preferences, mode: "sportsbook", sportsbook: "espnbet" }), {});
  assert.equal(selectGameMarkets(partial, { ...preferences, includedBooks: [] }).spread?.awayLine, null);
});
