"use client";

import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankEntry {
  player_id: string;
  rank: number;
}

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

interface Props {
  ranks: RankEntry[];
}

// ─── Position Colors ──────────────────────────────────────────────────────────

const POSITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  QB:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30"     },
  WR:    { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30"     },
  RB:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  TE:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30"  },
  K:     { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30"  },
  DEF:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30"   },
  DST:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30"   },
  FLEX:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30"  },
  SFLEX: { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30"    },
};

const DEFAULT_COLORS = {
  bg: "bg-[var(--surface-hover)]",
  text: "text-[var(--text-muted)]",
  border: "border-[var(--border)]",
};

function getPositionColors(pos: string) {
  return POSITION_COLORS[pos?.toUpperCase()] ?? DEFAULT_COLORS;
}

// ─── Rank Number Color ────────────────────────────────────────────────────────

function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-orange-400";
  if (rank <= 10) return "text-[var(--foreground)]";
  return "text-[var(--text-muted)]";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] animate-pulse">
    <div className="w-7 shrink-0">
      <div className="h-3.5 w-5 rounded bg-[var(--surface-hover)]" />
    </div>
    <div className="flex-1 flex items-center gap-3">
      <div className="h-3.5 w-32 rounded bg-[var(--surface-hover)]" />
      <div className="h-5 w-10 rounded-full bg-[var(--surface-hover)]" />
    </div>
    <div className="h-3 w-10 rounded bg-[var(--surface-hover)]" />
  </div>
);

// ─── Player Row ───────────────────────────────────────────────────────────────

const PlayerRow = ({ rank, player }: ResolvedPlayer) => {
  const primaryPos = player.fantasyPositions?.[0] ?? "—";
  const colors = getPositionColors(primaryPos);

  return (
    <div className="group flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-100">

      {/* Rank number */}
      <div className="w-7 shrink-0 text-right">
        <span className={`text-sm font-semibold tabular-nums ${getRankColor(rank)}`}>
          {rank}
        </span>
      </div>

                  {/* Player image */}
                  <div className="relative shrink-0">
              <img
                src={`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`}
                alt={`${player.fullName}`}
                className="w-15 h-15 rounded-full object-cover object-top bg-gray-200 dark:bg-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://sleepercdn.com/images/v2/icons/player_default.webp";
                }}
              />
            </div>

      {/* Player info */}
      <div className="flex-1 flex items-center gap-[5px] min-w-0">
        <span className="flex text-sm font-medium text-[var(--foreground)] truncate">
          {player.firstName} {player.lastName} {player.yearsExp == 0 ? <img src="/rookie.png" alt="Rookie icon" width={20} height={20} className="ml-[5px]" /> : ""}
        </span>
        {/* Position badge */}
        <span className={`inline-flex items-center text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>
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

// ─── Component ────────────────────────────────────────────────────────────────

const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

const RankingList = ({ ranks }: Props) => {
  const { players, loading, error } = usePlayers();
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");

  // Merge ranks with player metadata, sorted by rank
  const resolved = useMemo<ResolvedPlayer[]>(() => {
    if (!players || !ranks) return [];
  
    return ranks
      .map((entry) => ({
        rank: entry.rank,
        player: players[entry.player_id] as Player | undefined,
      }))
      .filter((e): e is ResolvedPlayer => !!e.player)
      .sort((a, b) => a.rank - b.rank);
  }, [players, ranks]);

  // Apply search + position filter
  const filtered = useMemo(() => {
    return resolved.filter(({ player }) => {
      const fullName = `${player.firstName.replace(/[.,'’-]/g, "")} ${player.lastName.replace(/[.,'’-]/g, "")}`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase()) ||
        player.team?.toLowerCase().includes(search.toLowerCase());
      const matchesPos =
        posFilter === "ALL" ||
        player.position?.includes(posFilter);
      return matchesSearch && matchesPos;
    });
  }, [resolved, search, posFilter]);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b border-[var(--border)]">

        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Position filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {POSITIONS.map((pos) => {
            const active = posFilter === pos;
            const colors = pos !== "ALL" ? getPositionColors(pos) : null;
            return (
              <button
                key={pos}
                onClick={() => setPosFilter(pos)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  active
                    ? pos === "ALL"
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                      : `${colors?.bg} ${colors?.text} ${colors?.border}`
                    : "bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-hover)]"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs text-[var(--text-muted)]">
          {loading ? "Loading..." : `${filtered.length} players`}
        </span>
      </div>

      {/* List */}
      <div>
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--text-muted)]">
            Failed to load players.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-sm text-[var(--text-muted)]">No players found</span>
            {(search || posFilter !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setPosFilter("ALL"); }}
                className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map(({ rank, player }) => (
            <PlayerRow key={player.id} rank={rank} player={player} />
          ))
        )}
      </div>
    </div>
  );
};

export default RankingList;