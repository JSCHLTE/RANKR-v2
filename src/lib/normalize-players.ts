import { PlayerLite } from "@/types/player";

interface SourcePlayer {
  player_id: string;
  first_name?: string;
  last_name?: string;
  team?: string;
  fantasy_positions?: string[];
}

export function normalizePlayers(source: SourcePlayer[], experience: Record<string, number> = {}): Record<string, PlayerLite> {
  return Object.fromEntries(source.map(player => {
    const firstName = player.first_name ?? "";
    const lastName = player.last_name ?? "";
    return [player.player_id, {
      id: player.player_id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      team: player.team || "FA",
      position: player.fantasy_positions?.[0] ?? "",
      fantasyPositions: player.fantasy_positions ?? [],
      yearsExp: experience[player.player_id] ?? null,
    }];
  }));
}
