"use client";

import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { getPositionColors } from "@/constants/positions";
import SkeletonRow from "../_components/SkeletonRow";
import PlayerRow from "../_components/PlayerRow";
import { PlayerLite, ResolvedPlayer } from "@/types/player";

//Types
interface RankEntry {
  player_id: string;
  rank: number;
}

interface Ranks {
  ranks: RankEntry[];
}

const RankingList = ({ ranks }: Ranks) => {
  const { players, loading, error } = usePlayers();
  const [search, setSearch] = useState("");
  const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF", "ROOKIE"];
  const [posFilter, setPosFilter] = useState("ALL");

  // Merge ranks with player metadata, sorted by rank
  const resolved = useMemo<ResolvedPlayer[]>(() => {
    if (!players || !ranks) return [];
  
    return ranks
      .map((entry) => ({
        rank: entry.rank,
        player: players[entry.player_id] as PlayerLite | undefined,
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

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
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
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