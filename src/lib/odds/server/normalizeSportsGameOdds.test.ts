import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeSportsGameOdds } from "./normalizeSportsGameOdds";
import { providerEvent } from "./testHelpers";
import { weekRange } from "./weekRange";
import { splitProps } from "./snapshot";
import { PROVIDER_BOOKS } from "./providerMapping";
import { SPORTSBOOK_IDS } from "../sportsbooks";

test("normalizes verified v2 fields to RANKR without using provider consensus", () => {
  const [game] = normalizeSportsGameOdds([providerEvent()], 2026, 1);
  assert.equal(game.slug, "buf-mia");
  assert.equal(game.gameOdds.draftkings?.moneyline?.awayOdds, -170);
  assert.equal(game.gameOdds.draftkings?.spread?.awayLine, -3.5);
  assert.deepEqual(game.gameOdds.draftkings?.total, { line: 48.5, overOdds: -110, underOdds: -115 });
  assert.equal(game.playerProps[0].team, "BUF");
  assert.equal(game.playerProps[0].sportsbooks.fanduel?.line, 267.5);
  assert.equal(game.sourceUpdatedAt, "2026-09-10T12:00:00.000Z");
  assert.deepEqual(Object.values(PROVIDER_BOOKS).sort(), [...SPORTSBOOK_IDS].sort());
});
test("unavailable, non-main, unsupported and missing prices never become zero", () => {
  const event = providerEvent();
  event.odds.propOver.byBookmaker.fanduel.available = false;
  event.odds.propUnder.byBookmaker.draftkings.odds = "";
  event.odds.spread.byBookmaker.draftkings.spread = "0";
  event.odds.spread.byBookmaker.draftkings.odds = "0";
  Object.assign(event.odds.ml.byBookmaker, { unknown: { odds: "-900", available: true }, espnbet: { odds: "+110", available: true, isMainLine: false } });
  const [game] = normalizeSportsGameOdds([event], 2026, 1);
  assert.equal(game.gameOdds.draftkings?.spread?.awayLine, 0);
  assert.equal(game.gameOdds.draftkings?.spread?.awayOdds, undefined);
  assert.equal(game.playerProps[0].sportsbooks.fanduel, undefined);
  assert.equal(game.playerProps[0].sportsbooks.draftkings?.underOdds, undefined);
  assert.deepEqual(Object.keys(game.gameOdds), ["draftkings"]);
});
test("different over/under lines at one book are never combined", () => {
  const event = providerEvent();
  event.odds.under.byBookmaker.draftkings.overUnder = "49.5";
  event.odds.propUnder.byBookmaker.draftkings.overUnder = "266.5";
  const [game] = normalizeSportsGameOdds([event], 2026, 1);
  assert.equal(game.gameOdds.draftkings?.total, undefined);
  assert.equal(game.playerProps[0].sportsbooks.draftkings, undefined);
  assert.equal(game.playerProps[0].sportsbooks.fanduel?.line, 267.5);
});
test("unsupported categories, periods, and malformed events are handled safely", () => {
  const event = providerEvent();
  event.odds.propOver.statID = "defense_tackles";
  event.odds.propUnder.periodID = "1h";
  assert.equal(normalizeSportsGameOdds([event], 2026, 1)[0].playerProps.length, 0);
  assert.throws(() => normalizeSportsGameOdds([{}], 2026, 1));
  assert.throws(() => normalizeSportsGameOdds([{ ...event, odds: [] }], 2026, 1));
  assert.throws(() => normalizeSportsGameOdds([event, event], 2026, 1));
  assert.throws(() => normalizeSportsGameOdds([{ ...event, eventID: "../escape" }], 2026, 1));
  assert.equal(normalizeSportsGameOdds([{ ...event, status: { startsAt: "2026-09-16T04:00:00Z" } }], 2026, 1).length, 0);
  assert.equal(normalizeSportsGameOdds([{ ...event, status: { ...event.status, cancelled: true } }], 2026, 1).length, 0);
});
test("server week boundaries include the Wednesday opener, DST, and January", () => {
  assert.deepEqual(weekRange(2026, 1), { startsAfter: "2026-09-09T04:00:00.000Z", startsBefore: "2026-09-16T04:00:00.000Z" });
  assert.deepEqual(weekRange(2026, 8), { startsAfter: "2026-10-28T04:00:00.000Z", startsBefore: "2026-11-04T05:00:00.000Z" });
  assert.equal(weekRange(2026, 18).startsAfter, "2027-01-06T05:00:00.000Z");
  for (const [season, week] of [[2027, 1], [2026, 0], [2026, 19], [2026, 1.5]]) assert.throws(() => weekRange(season, week));
});
test("prop shards split by size and keep every prop exactly once", () => {
  const prop = normalizeSportsGameOdds([providerEvent()], 2026, 1)[0].playerProps[0];
  const props = Array.from({ length: 20 }, (_, index) => ({ ...prop, playerId: `player-${index}` }));
  const shards = splitProps(props, 1000);
  assert.ok(shards.length > 1);
  assert.deepEqual(shards.flatMap(shard => shard.props), props);
  assert.equal(new Set(shards.map(shard => shard.id)).size, shards.length);
  assert.throws(() => splitProps(props, 10));
});
