export interface TemplatePlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  search_full_name?: string;
  team?: string | null;
  fantasy_positions: string[];
  injury?: boolean;
  injury_severity?: string;
  injury_note?: string;
  injury_name?: string;
  injury_expected_return?: string;
  injury_reinjury_risk?: string;
}
export interface TemplateData {
  players: TemplatePlayer[];
  ranks: { player_id: string; rank: number }[];
}
export interface TemplateSnapshot extends TemplateData { revision: string }

export function templateError(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Invalid template.";
  const data = value as TemplateData;
  if (!Array.isArray(data.players) || !Array.isArray(data.ranks) || !data.players.length || !data.ranks.length || data.players.length > 10000 || data.ranks.length > 10000) return "Supply nonempty player and ranking lists (up to 10,000 entries).";
  const ids = new Set<string>();
  for (const player of data.players) {
    if (!player || typeof player.player_id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(player.player_id) || ids.has(player.player_id)) return "Player IDs must be valid and unique.";
    ids.add(player.player_id);
    if (typeof player.first_name !== "string" || typeof player.last_name !== "string" || !(player.first_name + player.last_name).trim()) return "Every player needs a name.";
    if (!Array.isArray(player.fantasy_positions) || !player.fantasy_positions.length || !player.fantasy_positions.every(p => ["QB", "RB", "WR", "TE", "K", "DEF", "DST", "FLEX", "SFLEX", "DB", "CB", "S", "FS", "SS", "LB", "ILB", "OLB", "DL", "DE", "DT", "NT", "EDGE", "IDP", "P", "LS", "FB"].includes(p))) return "Every player needs valid positions.";
    for (const field of ["first_name", "last_name", "search_full_name", "team", "injury_note", "injury_name", "injury_expected_return", "injury_reinjury_risk"] as const) {
      const value = player[field];
      if (field === "team" && value === null) continue;
      if (value !== undefined && (typeof value !== "string" || value.length > 5000)) return `Invalid ${field}.`;
    }
    if (player.injury !== undefined && typeof player.injury !== "boolean") return "Invalid injury flag.";
    if (player.injury_severity !== undefined && !["", "low", "medium", "high"].includes(player.injury_severity)) return "Invalid injury severity.";
  }
  const ranked = new Set<string>();
  const numbers = new Set<number>();
  for (const entry of data.ranks) {
    if (!entry || !ids.has(entry.player_id) || ranked.has(entry.player_id)) return "Ranks must reference unique existing players.";
    if (!Number.isInteger(entry.rank) || entry.rank < 1 || entry.rank > data.ranks.length || numbers.has(entry.rank)) return "Ranks must be consecutive and unique.";
    ranked.add(entry.player_id); numbers.add(entry.rank);
  }
  return null;
}
