import assert from "node:assert/strict";
import { test } from "node:test";
import { nextTier, validTiers, tierDropRank, type RankingTier } from "./ranking-tiers";
import { isRankingUpdate } from "./ranking-update";

test("tier drops match the sortable preview in both directions and at list boundaries", () => {
  // Moving down past Taylor at rank 5 must leave him above the tier.
  assert.equal(tierDropRank(2, 5), 6);
  // Moving upward onto rank 2 places the header before that player.
  assert.equal(tierDropRank(6, 2), 2);
  assert.equal(tierDropRank(2, 2), 3);
  assert.equal(tierDropRank(1, 10), 11);
  assert.equal(tierDropRank(11, 1), 1);
  // Filtered views still use overall ranks, including hidden players.
  assert.equal(tierDropRank(3, 20), 21);
});

test("defaults progress from S through E, then use muted colors without duplicating names", () => {
  const tiers: RankingTier[] = [];
  for (let i = 0; i < 30; i++) tiers.push({ id: String(i), ...nextTier(tiers) });
  assert.deepEqual(tiers.slice(0, 7).map(tier => tier.name), ["S", "A", "B", "C", "D", "E", "F"]);
  assert.ok(tiers.slice(6).every(tier => tier.color >= 6 && tier.color <= 9));
  assert.equal(new Set(tiers.map(tier => tier.name)).size, tiers.length);
  assert.equal(nextTier([{ ...tiers[0], name: " s " }]).name, "A");
});

test("validates tier IDs, names, colors, and boundaries including after the last player", () => {
  const tier = { id: "tier-1", name: "Elite", color: 0, beforeRank: 3 };
  assert.ok(validTiers([tier], 2));
  for (const patch of [{ id: "bad/id" }, { name: " " }, { name: "x".repeat(16) }, { color: -1 }, { color: 10 }, { beforeRank: 0 }, { beforeRank: 4 }, { beforeRank: 1.5 }]) {
    assert.equal(validTiers([{ ...tier, ...patch }], 2), false);
  }
  assert.equal(validTiers([tier, tier], 2), false);
  assert.ok(validTiers([{ ...tier, name: "x".repeat(15) }], 2));
});

test("legacy updates remain compatible, explicit empty tiers remove headers, bad tiers reject the update", () => {
  const update = { rankingId: "r1", name: "Test", description: "", ranks: [{ player_id: "1", rank: 1 }] };
  assert.ok(isRankingUpdate(update));
  assert.ok(isRankingUpdate({ ...update, tiers: [] }));
  assert.equal(isRankingUpdate({ ...update, tiers: [{ id: "t1", name: "S", color: 0, beforeRank: 3 }] }), false);
});
