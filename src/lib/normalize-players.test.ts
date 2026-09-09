import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizePlayers } from "./normalize-players";

test("current player source resolves every ranked ID, including Zonovan Knight", () => {
  const source = JSON.parse(readFileSync("public/data/players_lite.json", "utf8"));
  const ranks: { player_id: string }[] = JSON.parse(readFileSync("public/data/player_rankings.json", "utf8"));
  const players = normalizePlayers(source);
  assert.equal(players["8122"].fullName, "Zonovan Knight");
  assert.equal(players["8122"].position, "RB");
  assert.deepEqual(ranks.filter(entry => !players[entry.player_id]), []);
  assert.deepEqual(players.ARI.fantasyPositions, ["DEF"]);
});

test("experience supplements metadata without hiding players or inventing rookies", () => {
  const players = normalizePlayers([
    { player_id: "new", first_name: "New", last_name: "Player", fantasy_positions: ["RB"] },
    { player_id: "rookie", first_name: "Rookie" },
  ], { rookie: 0, stale: 5 });
  assert.equal(players.new.yearsExp, null);
  assert.equal(players.new.team, "FA");
  assert.equal(players.rookie.yearsExp, 0);
  assert.equal(players.stale, undefined);
});
