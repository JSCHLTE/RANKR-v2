export interface RankingTier { id: string; name: string; beforeRank: number; color: number }
// Sortable's downward preview shifts the target player above the dragged header.
// Store the boundary after that player; upward drops remain before the target.
export function tierDropRank(beforeRank: number, targetPlayerRank: number): number {
  return targetPlayerRank >= beforeRank ? targetPlayerRank + 1 : targetPlayerRank;
}
const defaults = ["S", ..."ABCDEFGHIJKLMNOPQRTUVWXYZ"];
export const tierColors = ["#f87171", "#fb923c", "#facc15", "#a3e635", "#34d399", "#60a5fa", "#94a3b8", "#a1a1aa", "#9ca3af", "#a8a29e"];
export function nextTier(tiers: RankingTier[]): Omit<RankingTier, "id"> {
  const used = new Set(tiers.map(tier => tier.name.trim().toUpperCase()));
  let index = defaults.findIndex(name => !used.has(name));
  if (index < 0) index = defaults.length;
  let name = defaults[index] ?? `Tier ${tiers.length + 1}`;
  let suffix = tiers.length + 1;
  while (used.has(name.toUpperCase())) name = `Tier ${++suffix}`;
  return { name, beforeRank: 1, color: Math.min(index, 6) === 6 ? 6 + (index - 6) % 4 : index };
}
export function validTiers(value: unknown, playerCount: number): value is RankingTier[] {
  if (!Array.isArray(value) || value.length > 100) return false;
  return value.every(tier => tier && typeof tier.id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(tier.id)
    && typeof tier.name === "string" && tier.name.trim().length > 0 && tier.name.length <= 15
    && Number.isInteger(tier.beforeRank) && tier.beforeRank >= 1 && tier.beforeRank <= playerCount + 1
    && Number.isInteger(tier.color) && tier.color >= 0 && tier.color < tierColors.length)
    && new Set(value.map(tier => tier.id)).size === value.length;
}
