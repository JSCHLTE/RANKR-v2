import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTestModule, providerEvent } from "./testHelpers";
import type { syncOdds } from "./syncOdds";
import type { NormalizedGame } from "./normalizeSportsGameOdds";

function setup(events: unknown[], failedFetch = false) {
  const calls: string[] = [];
  const pipeline = loadTestModule<{ syncOdds: typeof syncOdds }>("src/lib/odds/server/syncOdds.ts", {
    "./sportsGameOdds": { requireSportsGameOddsKey: () => "test-only", async fetchNFLEvents() {
      calls.push("fetch");
      if (failedFetch) throw new Error("Fetch failed");
      return events;
    } },
    "./store": { async currentRevision() { calls.push("revision"); return "revision-before-fetch"; }, async publishSnapshot(season: number, week: number, games: NormalizedGame[], revision: string) {
      calls.push("publish");
      assert.equal(season, 2026); assert.equal(week, 1);
      assert.equal(revision, "revision-before-fetch");
      assert.equal(games[0].playerProps[0].playerName, "Josh Allen");
      return "2026-09-14T12:00:00.000Z";
    } },
  });
  return { sync: pipeline.syncOdds, calls };
}
test("sync fetches and normalizes before publishing, returns counts and books", async () => {
  const context = setup([providerEvent()]);
  const result = await context.sync(2026, 1);
  assert.deepEqual(context.calls, ["revision", "fetch", "publish"]);
  assert.equal(result.gamesFetched, 1);
  assert.equal(result.gamesWritten, 1);
  assert.equal(result.propsWritten, 1);
  assert.equal(JSON.stringify(result.sportsbooksFound), '["draftkings","fanduel"]');
});
test("empty, malformed and failed provider responses never write Firestore", async () => {
  for (const context of [setup([]), setup([{}]), setup([providerEvent()], true)]) {
    await assert.rejects(context.sync(2026, 1));
    assert.deepEqual(context.calls, ["revision", "fetch"]);
  }
});
