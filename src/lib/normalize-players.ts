import { PlayerLite } from "@/types/player";

interface SourcePlayer {
  player_id: string;
  years_exp?: number | null;
  first_name?: string;
  last_name?: string;
  team?: string | null;
  fantasy_positions?: string[];
  injury?: boolean;
  injury_severity?: string;
  injury_note?: string;
  injury_name?: string;
  injury_expected_return?: string;
  injury_reinjury_risk?: string;
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
      yearsExp: typeof player.years_exp === "number" && Number.isInteger(player.years_exp) && player.years_exp >= 0
        ? player.years_exp : experience[player.player_id] ?? null,
      injury: player.injury === true,
      injurySeverity: player.injury_severity === "low" || player.injury_severity === "medium" || player.injury_severity === "high" ? player.injury_severity : null,
      injuryNote: player.injury_note ?? "",
      injuryName: player.injury_name ?? "",
      injuryExpectedReturn: player.injury_expected_return ?? "",
      injuryReinjuryRisk: player.injury_reinjury_risk ?? "",
    }];
  }));
}
