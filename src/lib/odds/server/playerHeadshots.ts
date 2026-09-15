interface LitePlayer {
  search_full_name?: string;
  first_name: string;
  last_name: string;
  player_id: string;
  team: string | null;
}

const nameKey = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const teamKey = (team: string) => ({ JAC: "JAX", WSH: "WAS", LA: "LAR" })[team as "JAC" | "WSH" | "LA"] ?? team;

// Build once per sync; never ship the player directory to the odds browser bundle.
export function playerHeadshotLookup(players: LitePlayer[]) {
  const names = new Map<string, Map<string, LitePlayer>>();
  for (const player of players) {
    if (!/^\d+$/.test(player.player_id)) continue;
    for (const key of new Set([nameKey(player.search_full_name ?? ""), nameKey(`${player.first_name} ${player.last_name}`)])) {
      if (!key) continue;
      const matches = names.get(key) ?? new Map<string, LitePlayer>();
      matches.set(player.player_id, player);
      names.set(key, matches);
    }
  }
  return (name: string, team: string): string | undefined => {
    const candidates = [...(names.get(nameKey(name))?.values() ?? [])];
    // A unique name remains usable after a trade. Duplicate names require a unique team match.
    if (candidates.length === 1) return candidates[0].player_id;
    const sameTeam = candidates.filter(player => player.team && teamKey(player.team) === teamKey(team));
    return sameTeam.length === 1 ? sameTeam[0].player_id : undefined;
  };
}
