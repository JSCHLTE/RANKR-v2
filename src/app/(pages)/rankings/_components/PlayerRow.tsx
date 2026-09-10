import { getPositionColors } from "@/constants/positions";
import { ResolvedPlayer } from "@/types/player";
import { memo } from "react";

const PlayerRow = ({ rank, player, positionalRank }: ResolvedPlayer) => {
    const primaryPos = player.fantasyPositions?.[0] ?? player.position ?? "—";
    const colors = getPositionColors(primaryPos);
  
    const injuryColor = player.injurySeverity === "low" ? "bg-green-400"
      : player.injurySeverity === "medium" ? "bg-yellow-400"
      : player.injurySeverity === "high" ? "bg-red-400" : "bg-[var(--text-muted)]";
    const injuryLabel = `Injured${player.injurySeverity ? ` (${player.injurySeverity} severity)` : ""}${player.injuryNote ? `: ${player.injuryNote}` : ""}`;

    return (
      <div className="group flex items-center gap-4 p-[0.4rem] border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-100 cursor-pointer">
  
        {/* Rank number */}
        <div className="w-5 shrink-0 text-right">
          <span className="text-sm font-semibold tabular-nums">
            {rank}
          </span>
        </div>
  
                    {/* Player image */}
                    <div className="relative shrink-0">
                <img
                  src={player.fantasyPositions.includes("DEF") ? `https://sleepercdn.com/images/team_logos/nfl/${player.id.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/${player.id}.jpg`}
                  alt={`${player.fullName}`}
                  draggable={false}
                  className="w-10 h-10 rounded-md object-cover object-top bg-[var(--surface-hover)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://sleepercdn.com/images/v2/icons/player_default.webp";
                  }}
                />
              </div>
  
        {/* Player info */}
        <div className="flex-1 flex items-center gap-[5px] min-w-0">
          <span className="flex items-center text-sm text-[var(--foreground)] truncate">
            {player.firstName} {player.lastName} {player.yearsExp == 0 ? <img src="/rookie.png" alt="Rookie icon" className="ml-[5px] w-[15px] h-[15px]" title="Rookie"/> : ""}
          </span>
          {player.injury === true && <span role="img" aria-label={injuryLabel} title={injuryLabel}
            className={`inline-block h-4 w-4 shrink-0 ${injuryColor}`}
            style={{ mask: "url('/injury.svg') center / contain no-repeat", WebkitMask: "url('/injury.svg') center / contain no-repeat" }} />}
          {/* Position badge */}
          <span className={`inline-flex items-center text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-lg border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
            {primaryPos}{positionalRank !== undefined ? ` ${positionalRank}` : ""}
          </span>
        </div>
  
        {/* Team */}
        <span className="text-xs text-[var(--text-muted)] shrink-0 uppercase tracking-wide">
          {player.team ?? "FA"}
        </span>
      </div>
    );
  };

export default memo(PlayerRow);
