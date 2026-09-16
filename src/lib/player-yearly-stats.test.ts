import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import test from "node:test";
import { careerColumns, careerStat, formatStat, parseYearlyStats, resolveStat, statGrade } from "./player-yearly-stats";

test("every supplied file parses and supported positions resolve both career views", () => {
  const positions = new Set<string>();
  for (const file of readdirSync("public/data/player-stats/yearly")) {
    const data = parseYearlyStats(JSON.parse(readFileSync(`public/data/player-stats/yearly/${file}`, "utf8")), file.replace("-yearly.json", ""));
    positions.add(data.playerInfo.position);
    for (const season of data.allYearlyStats) for (const column of careerColumns(data)) {
      for (const mode of ["Totals", "Averages"] as const) assert.doesNotMatch(formatStat(careerStat(season, column, mode)), /NaN|undefined|null/);
    }
  }
  for (const position of ["QB", "RB", "WR", "TE"]) assert.ok(positions.has(position));
  assert.equal(existsSync("public/data/player-stats/yearly/NE-yearly.json"), false);
});
test("Gibbs uses supplied totals, per-game ranks, season shares and games", () => {
  const data = parseYearlyStats(JSON.parse(readFileSync("public/data/player-stats/yearly/9221-yearly.json", "utf8")), "9221");
  const season = data.allYearlyStats.find(season => season.year === 2023)!;
  const columns = careerColumns(data);
  for (const id of ["FantasyPointsPPR", "FantasyPointsRankRB", "RushingAttempts", "RoutesRun"]) {
    const column = columns.find(column => column.id === id)!;
    assert.equal(careerStat(season, column, "Averages")?.value, resolveStat(season.stats, id, ["regular_per_game"])?.value);
  }
  for (const id of ["Games", "SnapShare", "CarryPercentage"]) {
    const column = columns.find(column => column.id === id)!;
    assert.deepEqual(careerStat(season, column, "Totals"), careerStat(season, column, "Averages"));
  }
});
test("fallback counts are neutral, missing ranks are not fabricated, and grades invert", () => {
  const stat = { serial_id: "Receptions", stat_context: "regular", value: 21, min_value: 0, max_value: 100, is_highest_best: true };
  const season = { year: 2025, team: null, stats: [stat, { serial_id: "Games", stat_context: "regular", value: 2 }] };
  const column = { id: "Receptions", label: "REC", group: "Receiving", kind: "count" as const };
  const average = careerStat(season, column, "Averages");
  assert.equal(average?.value, 10.5); assert.equal(statGrade(average), undefined);
  assert.equal(careerStat(season, { ...column, kind: "rank" }, "Averages"), undefined);
  assert.equal(statGrade({ ...stat, value: 0, is_highest_best: false }), 4);
  assert.equal(statGrade({ ...stat, value: 200 }), 4);
  assert.equal(statGrade({ ...stat, max_value: 0 }), undefined);
  assert.equal(formatStat({ ...stat, value: null }), "—");
  assert.throws(() => parseYearlyStats({}, "9221"));
  assert.throws(() => parseYearlyStats({ playerInfo: { player_id: "wrong" }, allYearlyStats: [] }, "9221"));
});
