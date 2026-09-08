export interface RankEntry { player_id: string; rank: number }
export interface RankingUpdate {
  rankingId: string;
  name: string;
  description: string;
  ranks: RankEntry[];
}

export function isRankingUpdate(value: unknown): value is RankingUpdate {
  if (!value || typeof value !== "object") return false;
  const body = value as RankingUpdate;
  return typeof body.rankingId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(body.rankingId)
    && typeof body.name === "string" && body.name.trim().length > 0 && body.name.length <= 200
    && typeof body.description === "string" && body.description.length <= 5000
    && Array.isArray(body.ranks) && body.ranks.length <= 20000
    && body.ranks.every((entry: RankEntry) => entry && typeof entry.player_id === "string"
      && entry.player_id.length > 0 && Number.isInteger(entry.rank) && entry.rank >= 1 && entry.rank <= body.ranks.length)
    && new Set(body.ranks.map(entry => entry.player_id)).size === body.ranks.length
    && new Set(body.ranks.map(entry => entry.rank)).size === body.ranks.length;
}

export function hasSamePlayers(existing: RankEntry[], updated: RankEntry[]): boolean {
  const ids = new Set(existing.map(entry => entry.player_id));
  return existing.length === updated.length && updated.every(entry => ids.has(entry.player_id));
}
