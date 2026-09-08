import assert from "node:assert/strict";
import { test } from "node:test";
import { hasSamePlayers, isRankingUpdate } from "./ranking-update";

const ranks = [{ player_id: "a", rank: 1 }, { player_id: "b", rank: 2 }];
const valid = { rankingId: "ranking-123", name: "My ranking", description: "", ranks };

test("accepts a complete reordered ranking and an empty description", () => {
  const reordered = [{ player_id: "b", rank: 1 }, { player_id: "a", rank: 2 }];
  assert.ok(isRankingUpdate({ ...valid, ranks: reordered }));
  assert.ok(hasSamePlayers(ranks, reordered));
});

test("rejects malformed metadata and document paths", () => {
  for (const value of [null, [], {}, { ...valid, rankingId: "a/b" }, { ...valid, name: "  " },
    { ...valid, name: "a".repeat(201) }, { ...valid, description: 5 }, { ...valid, description: "a".repeat(5001) }]) {
    assert.equal(isRankingUpdate(value), false);
  }
});

test("rejects duplicate players, duplicate ranks, gaps and invalid ranks", () => {
  for (const invalid of [
    [ranks[0], ranks[0]],
    [ranks[0], { player_id: "a", rank: 2 }],
    [ranks[0], { player_id: "b", rank: 1 }],
    [ranks[0], { player_id: "b", rank: 3 }],
    [ranks[0], { player_id: "b", rank: 1.5 }],
    [ranks[0], { player_id: "b", rank: "2" }],
    [null],
  ]) assert.equal(isRankingUpdate({ ...valid, ranks: invalid }), false);
});

test("rejects added, removed or substituted players", () => {
  assert.equal(hasSamePlayers(ranks, [ranks[0]]), false);
  assert.equal(hasSamePlayers(ranks, [...ranks, { player_id: "c", rank: 3 }]), false);
  assert.equal(hasSamePlayers(ranks, [ranks[0], { player_id: "c", rank: 2 }]), false);
});
