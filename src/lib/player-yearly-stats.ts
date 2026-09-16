export interface YearlyStat {
  serial_id: string;
  stat_context: string;
  value: number | null;
  description?: string;
  stat_category?: string;
  value_type?: string;
  min_value?: number | null;
  max_value?: number | null;
  is_highest_best?: boolean;
  display_decimal_places?: number;
}
export interface PlayerSeason { year: number; team: { abbr?: string } | null; stats: YearlyStat[] }
export interface PlayerYearlyStats { playerInfo: { player_id: string | number; name: string; position: string }; allYearlyStats: PlayerSeason[] }
export interface StatColumn { id: string; label: string; group: string; kind: "count" | "rate" | "rank" | "games" }
export type CareerMode = "Totals" | "Averages";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function parseYearlyStats(value: unknown, playerId: string): PlayerYearlyStats {
  // Filenames use Sleeper IDs; some embedded playerInfo IDs still use the upstream namespace.
  const data = value as PlayerYearlyStats;
  // The source encodes some per-game positional ranks as numeric strings.
  const numeric = (raw: unknown) => typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw)) ? Number(raw) : raw;
  if (Array.isArray(data?.allYearlyStats)) {
    for (const season of data.allYearlyStats) if (Array.isArray(season?.stats)) {
      for (const stat of season.stats) if (stat && typeof stat === "object") {
        stat.value = (stat.value as unknown) === "INJ" ? null : numeric(stat.value) as number | null;
        stat.min_value = numeric(stat.min_value) as number | null | undefined;
        stat.max_value = numeric(stat.max_value) as number | null | undefined;
      }
    }
  }
  if (!data?.playerInfo || typeof data.playerInfo.position !== "string" || !Array.isArray(data.allYearlyStats) || data.allYearlyStats.some(season => !season || !finite(season.year) || !Array.isArray(season.stats) || season.stats.some(stat => !stat || typeof stat.serial_id !== "string" || typeof stat.stat_context !== "string" || (stat.value !== null && !finite(stat.value))))) {
    throw new Error(`The career stats file for ${playerId} could not be read.`);
  }
  return data;
}
export function resolveStat(stats: YearlyStat[], id: string, contexts: string[]) {
  for (const context of contexts) {
    const stat = stats.find(item => item.serial_id === id && item.stat_context === context && finite(item.value));
    if (stat) return stat;
  }
  return undefined;
}
export function careerStat(season: PlayerSeason, column: StatColumn, mode: CareerMode): YearlyStat | undefined {
  const totals = ["regular", "calculated_yearly"];
  if (column.kind === "games") return resolveStat(season.stats, column.id, ["regular"]);
  if (column.kind === "rate") return resolveStat(season.stats, column.id, ["regular", "calculated_yearly_avg", "calculated_yearly"]);
  if (mode === "Totals") return resolveStat(season.stats, column.id, totals);
  const average = resolveStat(season.stats, column.id, ["regular_per_game", "calculated_yearly_avg"]);
  if (average || column.kind !== "count") return average;
  const total = resolveStat(season.stats, column.id, totals);
  const games = resolveStat(season.stats, "Games", ["regular"]);
  // Only genuine counts can fall back to total / games. Total ranges cannot grade per-game values.
  if (total && finite(total.value) && games && finite(games.value) && games.value > 0) return { ...total, value: total.value / games.value, min_value: null, max_value: null, display_decimal_places: 2, description: `${total.description || column.label} (calculated per game)` };
}
export function formatStat(stat?: YearlyStat) {
  if (!stat || !finite(stat.value)) return "—";
  const digits = finite(stat.display_decimal_places) ? Math.max(0, Math.min(6, Math.trunc(stat.display_decimal_places))) : undefined;
  return stat.value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits ?? 2 }) + (stat.value_type === "percent" ? "%" : "");
}
export function statGrade(stat?: YearlyStat): number | undefined {
  if (!stat || !finite(stat.value) || !finite(stat.min_value) || !finite(stat.max_value) || stat.max_value <= stat.min_value || typeof stat.is_highest_best !== "boolean") return;
  let score = Math.max(0, Math.min(1, (stat.value - stat.min_value) / (stat.max_value - stat.min_value)));
  if (!stat.is_highest_best) score = 1 - score;
  return Math.min(4, Math.floor(score * 5));
}
export function careerColumns(data: PlayerYearlyStats): StatColumn[] {
  const position = data.playerInfo.position;
  const columns: StatColumn[] = [];
  const add = (group: string, id: string, label: string, kind: StatColumn["kind"] = "count") => columns.push({ group, id, label, kind });
  add("Season", "Games", "GP", "games");
  add("Fantasy points", "FantasyPointsPPR", "PPR");
  add("Fantasy points", `FantasyPointsRank${position}`, "Rank", "rank");
  if (position === "QB") {
    for (const [id, label] of [["PassingAttempts", "ATT"], ["PassingYards", "YD"], ["PassingTouchdowns", "TD"], ["PassingInterceptions", "INT"], ["PassingSacks", "Sacks"]]) add("Passing", id, label);
    for (const [id, label] of [["PassingCompletionPercentage", "CMP%"], ["PassingYardsPerAttempt", "YD/A"], ["AdjustedYardsPerAttempt", "AY/A"]]) add("Passing", id, label, "rate");
  }
  const rushing = () => {
    add("Rushing", "RushingAttempts", "CAR"); add("Rushing", "RushingYards", "YD");
    if (position !== "WR") { add("Rushing", "RushingTouchdowns", "TD"); add("Rushing", "RushingYardsPerAttempt", "YD/A", "rate"); }
    if (position === "RB") { add("Rushing", "CarryPercentage", "CAR%", "rate"); add("Rushing", "JukeRate", "JUKE%", "rate"); }
  };
  if (["QB", "RB"].includes(position)) rushing();
  if (["RB", "WR", "TE"].includes(position)) {
    for (const [id, label] of [["ReceivingTargets", "TAR"], ["Receptions", "REC"], ["ReceivingYards", "YD"], ["ReceivingTouchdowns", "TD"]]) add("Receiving", id, label);
    for (const [id, label] of [["ReceivingYardsPerTarget", "YPT"], ["YardsPerRouteRun", "YPRR"], ["TargetShare", "TS%"]]) add("Receiving", id, label, "rate");
  }
  if (position === "WR") rushing();
  add("Participation", "SnapShare", "SNP%", "rate"); add("Participation", "RoutesRun", "Routes");
  if (!["QB", "RB", "WR", "TE"].includes(position)) {
    for (const season of data.allYearlyStats) for (const stat of season.stats) {
      if (!columns.some(column => column.id === stat.serial_id) && ["regular", "calculated_yearly", "calculated_yearly_avg"].includes(stat.stat_context)) add(stat.stat_category || "Other", stat.serial_id, stat.description || stat.serial_id, "rate");
    }
  }
  return columns.filter(column => column.kind === "games" || data.allYearlyStats.some(season => careerStat(season, column, "Totals") || careerStat(season, column, "Averages")));
}

