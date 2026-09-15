import assert from "node:assert/strict";
import { test } from "node:test";
import { playerHeadshotLookup } from "./playerHeadshots";
import players from "../../../../public/data/players_lite.json";

test("matches directory IDs with punctuation and preserves unique names after trades", () => {
  const find = playerHeadshotLookup(players);
  assert.equal(find("Ja’Marr Chase", "CIN"), "7564");
  assert.equal(find("Jahmyr Gibbs", "DET"), "9221");
  assert.equal(find("Jahmyr Gibbs", "BUF"), "9221");
  assert.equal(find("Unknown Player", "DET"), undefined);
});

test("duplicate names require a unique team match; unmatched spellings are not guessed", () => {
  const base = { search_full_name: "alexsmith", first_name: "Alex", last_name: "Smith" };
  const find = playerHeadshotLookup([
    { ...base, player_id: "1", team: "JAC" },
    { ...base, player_id: "2", team: "BUF" },
    { ...base, player_id: "3", team: "BUF" },
  ]);
  assert.equal(find("Alex Smith", "JAX"), "1");
  assert.equal(find("Alex Smith", "BUF"), undefined);
  assert.equal(find("Alex Smith", "DET"), undefined);
  assert.equal(find("Alexander Smith", "JAX"), undefined);
});
