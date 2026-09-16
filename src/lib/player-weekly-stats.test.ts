import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { defaultWeeklySeason, parseWeeklyStats, weeklyColumns, weeklySeasons, weeklyStat } from "./player-weekly-stats";

function load(id: string) { return parseWeeklyStats(JSON.parse(readFileSync(`public/data/player-stats/weekly/${id}.json`, "utf8")), id); }

test("every weekly file parses, including textual opponents and future schedules", () => {
  const positions = new Set<string>();
  for (const file of readdirSync("public/data/player-stats/weekly")) {
    const data = load(file.replace(".json", ""));
    positions.add(data.playerInfo.position);
    for (const row of data.playerStats) {
      assert.equal(typeof row.opponent, "string");
      assert.equal(row.stats.some(stat => stat.serial_id === "opponent"), false);
    }
    for (const year of weeklySeasons(data)) {
      const columns = weeklyColumns(data, year);
      assert.equal(new Set(columns.map(column => `${column.context}:${column.id}`)).size, columns.length);
    }
  }
  assert.deepEqual([...positions].sort(), ["QB", "RB", "TE", "WR"]);
});

test("Gibbs logs resolve regular and situational stats independently", () => {
  const data = load("9221");
  const row = data.playerStats.find(row => row.year === 2025 && row.week === 1)!;
  const columns = weeklyColumns(data, 2025);
  assert.equal(weeklyStat(row, columns.find(column => column.id === "RushingAttempts" && column.context === "regular")!)?.value, 9);
  assert.equal(weeklyStat(row, columns.find(column => column.id === "RushingAttempts" && column.context === "redzone")!)?.value, 2);
  assert.ok(columns.some(column => column.id === "RushingAttemptsInside5" && column.context === "inside5"));
  assert.equal(defaultWeeklySeason(data), 2026);
  assert.equal(defaultWeeklySeason({ ...data, playerStats: data.playerStats.filter(row => row.year !== 2026 || row.upcoming) }), 2025);
  const scheduled = data.playerStats.find(row => row.upcoming)!;
  assert.notEqual(scheduled.opponent, "—");
  assert.equal(weeklyStat(scheduled, columns[0]), undefined);
});

test("position columns and malformed/empty files are handled", () => {
  for (const [id, expected] of [["10213", "ReceivingTargets"], ["10236", "RoutesRun"], ["11559", "PassingYards"]]) {
    const data = load(id);
    assert.ok(weeklyColumns(data, 2025).some(column => column.id === expected));
  }
  const empty = parseWeeklyStats({ playerInfo: { position: "K" }, playerStats: [] }, "kicker");
  assert.deepEqual(weeklySeasons(empty), []);
  assert.equal(defaultWeeklySeason(empty), undefined);
  assert.throws(() => parseWeeklyStats({}, "bad"));
  assert.throws(() => parseWeeklyStats({ playerInfo: { position: "WR" }, playerStats: [{ year: 2025, week: "bad", stats: [] }] }, "bad"));
});
