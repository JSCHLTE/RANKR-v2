"use client";

import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { getPositionColors } from "@/constants/positions";
import { RankingMeta } from "@/types/rank";

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
  meta: RankingMeta;
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
    <div className="group flex items-center gap-4 px-5 py-2 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-100 cursor-pointer">

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
        <span className="flex text-sm font-medium text-[var(--foreground)] truncate">
          {player.firstName} {player.lastName} {player.yearsExp == 0 ? <img src="/rookie.png" alt="Rookie icon" className="ml-[5px] w-[20px] h-[20px]" /> : ""}
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
const RankingList = ({ ranks, meta }: Props) => {
  const { players, loading, error } = usePlayers();
  const [search, setSearch] = useState("");
  const POSITIONS = meta.positionGroup.length > 1 ? ["ALL", ...meta.positionGroup] : meta.positionGroup;   
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
        posFilter === "ROOKIE" ? player.yearsExp === 0 :
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
        {meta.positionGroup.length > 1 &&
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
              <button
                onClick={() => setPosFilter("ROOKIE")}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer`}
              >
                ROOKIE
              </button>
        </div>}
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