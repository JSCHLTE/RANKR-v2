import assert from "node:assert/strict";
import { test } from "node:test";
import { templateError } from "./template-data";
import { normalizePlayers } from "./normalize-players";
import { injuryColor } from "../app/(pages)/rankings/_components/InjuryInfo";

test("severity validation, player data, and colors accept either casing", () => {
  for (const [level, color] of [["low", "text-green-400"], ["medium", "text-yellow-400"], ["high", "text-red-400"]]) {
    for (const value of [level, level[0].toUpperCase() + level.slice(1), ` ${level.toUpperCase()} `]) {
      const player = { player_id: "a", first_name: "Test", last_name: "Player", fantasy_positions: ["QB"], injury_severity: value };
      assert.equal(templateError({ players: [player], ranks: [{ player_id: "a", rank: 1 }] }), null);
      assert.equal(normalizePlayers([player]).a.injurySeverity, level);
      assert.equal(injuryColor(value), color);
    }
  }
});

test("unknown severity stays unset and invalid values identify the player", () => {
  for (const value of [undefined, "", "moderate", "severe"]) {
    const player = { player_id: "a", first_name: "Test", last_name: "Player", fantasy_positions: ["QB"], injury_severity: value };
    const error = templateError({ players: [player], ranks: [{ player_id: "a", rank: 1 }] });
    if (value) assert.match(error!, /Invalid injury severity for Test Player/);
    else assert.equal(error, null);
    assert.equal(normalizePlayers([player]).a.injurySeverity, null);
    assert.equal(injuryColor(value), "text-[var(--text-muted)]");
  }
});
