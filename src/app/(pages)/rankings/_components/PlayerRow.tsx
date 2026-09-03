import { getPositionColors } from "@/constants/positions";

interface Player {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    team: string;
    position: string;
    fantasyPositions: string[];
    yearsExp: number
  }

interface ResolvedPlayer {
    rank: number;
    player: Player;
}

const PlayerRow = ({ rank, player }: ResolvedPlayer) => {
    const primaryPos = player.fantasyPositions?.[0] ?? "—";
    const colors = getPositionColors(primaryPos);
  
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
                  src={`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`}
                  alt={`${player.fullName}`}
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
          {/* Position badge */}
          <span className={`inline-flex items-center text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-lg border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
            {primaryPos}
          </span>
        </div>
  
        {/* Team */}
        <span className="text-xs text-[var(--text-muted)] shrink-0 uppercase tracking-wide">
          {player.team ?? "FA"}
        </span>
      </div>
    );
  };

export default PlayerRow;