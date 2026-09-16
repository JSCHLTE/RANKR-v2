import { careerColumns, parseYearlyStats, resolveStat, type PlayerSeason, type PlayerYearlyStats, type StatColumn, type YearlyStat } from "./player-yearly-stats";

export interface PlayerWeek extends PlayerSeason {
  week: number;
  opponent: string;
  upcoming: boolean;
}
export interface PlayerWeeklyStats {
  playerInfo: PlayerYearlyStats["playerInfo"];
  playerStats: PlayerWeek[];
}
export interface WeeklyColumn extends StatColumn { context: string }

export function parseWeeklyStats(value: unknown, playerId: string): PlayerWeeklyStats {
  const data = value as { playerInfo: PlayerYearlyStats["playerInfo"]; playerStats: (Omit<PlayerSeason, "stats"> & { week: number; upcoming?: boolean; stats: (Omit<YearlyStat, "value"> & { value: unknown })[] })[] };
  if (!data?.playerInfo || !Array.isArray(data.playerStats)) throw new Error("The weekly stats file could not be read.");
  const weeks = data.playerStats.map(row => {
    if (!row || !Number.isInteger(row.week) || row.week < 1 || !Array.isArray(row.stats)) throw new Error("Invalid weekly game record.");
    const opponent = row.stats.find(stat => stat?.serial_id === "opponent" && stat.stat_context === "regular");
    return {
      ...row,
      opponent: typeof opponent?.value === "string" && opponent.value.trim() ? opponent.value : "—",
      upcoming: row.upcoming === true,
      stats: row.stats.filter(stat => stat?.serial_id !== "opponent"),
    };
  });
  // Reuse numeric normalization and validation; opponent is text, not a graded stat.
  const parsed = parseYearlyStats({ playerInfo: data.playerInfo, allYearlyStats: weeks }, playerId);
  return { playerInfo: parsed.playerInfo, playerStats: parsed.allYearlyStats as PlayerWeek[] };
}

export function weeklySeasons(data: PlayerWeeklyStats) {
  return [...new Set(data.playerStats.map(row => row.year))].sort((a, b) => b - a);
}
export function defaultWeeklySeason(data: PlayerWeeklyStats) {
  return weeklySeasons(data).find(year => data.playerStats.some(row => row.year === year && !row.upcoming && row.stats.some(stat => typeof stat.value === "number"))) ?? weeklySeasons(data)[0];
}
export function weeklyStat(row: PlayerWeek, column: WeeklyColumn) {
  return row.upcoming ? undefined : resolveStat(row.stats, column.id, [column.context]);
}

export function weeklyColumns(data: PlayerWeeklyStats, year: number): WeeklyColumn[] {
  const rows = data.playerStats.filter(row => row.year === year);
  // Scheduled-only seasons retain the player's available column layout with empty values.
  const source = rows.some(row => row.stats.length) ? rows : data.playerStats;
  const regular = careerColumns({ playerInfo: data.playerInfo, allYearlyStats: source })
    .filter(column => column.kind !== "games")
    .map(column => ({ ...column, context: "regular" }));
  const result: WeeklyColumn[] = [...regular];
  for (const [context, suffix] of [["redzone", "red zone"], ["inside10", "inside 10"], ["inside5", "inside 5"]]) {
    for (const group of ["Passing", "Rushing", "Receiving"]) {
      const definitions = group === "Passing"
        ? [[context === "inside5" ? "PassingAttemptsInside5" : "PassingAttempts", "ATT"], ["PassingYards", "YD"], ["PassingTouchdowns", "TD"], ["PassingInterceptions", "INT"], ["PassingCompletionPercentage", "CMP%"], ["PassingYardsPerAttempt", "YD/A"]]
        : group === "Rushing"
          ? [[context === "inside5" ? "RushingAttemptsInside5" : "RushingAttempts", "CAR"], ["RushingYards", "YD"], ["RushingYardsPerAttempt", "YD/A"], ["RushingTouchdowns", "TD"]]
          : [["ReceivingTargets", "TAR"], ["Receptions", "REC"], ["ReceivingYards", "YD"], ["ReceivingTouchdowns", "TD"], ["ReceivingYardsPerTarget", "YPT"]];
      for (const [id, label] of definitions) {
        if (source.some(row => resolveStat(row.stats, id, [context]))) result.push({ id, label, context, group: `${group} ${suffix}`, kind: "count" });
      }
    }
  }
  return result;
}
