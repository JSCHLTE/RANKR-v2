"use client";

import { useState, useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { getPositionColors } from "@/constants/positions";
import SkeletonRow from "../_components/SkeletonRow";
import PlayerRow from "../_components/PlayerRow";
import { PlayerLite, ResolvedPlayer } from "@/types/player";
import { useAuth } from "@/context/AuthContext";
import { author } from "@/types/rank";
import SortableRankingRows from "./SortableRankingRows";

//Types
interface RankEntry {
  player_id: string;
  rank: number;
}

interface Props {
  ranks: RankEntry[];
  author: author;
  isEditing: boolean;
  isSaving: boolean;
  onMove: (playerId: string, targetRank: number) => void;
}

const RankingList = ({ ranks, author, isEditing, isSaving, onMove }: Props) => {
  const { players, loading, error } = usePlayers();
  const [search, setSearch] = useState("");
  const POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF", "ROOKIE"];
  const [posFilters, setPosFilters] = useState<string[]>([]);
  const [rookiesOnly, setRookiesOnly] = useState(false);
  function toggleFilter(position: string) {
    if (position === "ALL") {
      setPosFilters([]);
      setRookiesOnly(false);
    } else if (position === "ROOKIE") {
      setRookiesOnly(previous => !previous);
    } else {
      setPosFilters(previous => previous.includes(position)
        ? previous.filter(value => value !== position)
        : [...previous, position]);
    }
  }
  const { user } = useAuth();
  const isOwner = user?.uid === author.uid;

  // Merge ranks with player metadata, sorted by rank
  const resolved = useMemo<ResolvedPlayer[]>(() => {
    if (!players || !ranks) return [];
  
    const positionCounts = new Map<string, number>();
    return ranks
      .map((entry) => ({
        rank: entry.rank,
        player: players[entry.player_id] as PlayerLite | undefined,
      }))
      .filter((e): e is ResolvedPlayer => !!e.player)
      .sort((a, b) => a.rank - b.rank)
      .map(entry => {
        // Count the full ranking before filtering; draft reorders recalculate these badges.
        const position = entry.player.fantasyPositions?.[0] ?? entry.player.position ?? "—";
        const positionalRank = (positionCounts.get(position) ?? 0) + 1;
        positionCounts.set(position, positionalRank);
        return { ...entry, positionalRank };
      });
  }, [players, ranks]);

  // Apply search + position filter
  const filtered = useMemo(() => {
    return resolved.filter(({ player }) => {
      const fullName = `${player.firstName.replace(/[.,'’-]/g, "")} ${player.lastName.replace(/[.,'’-]/g, "")}`.toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase()) ||
        player.team?.toLowerCase().includes(search.toLowerCase());
      const matchesPos = posFilters.length === 0 || posFilters.some(position =>
        player.position === position || player.fantasyPositions?.includes(position));
      return matchesSearch && matchesPos && (!rookiesOnly || player.yearsExp === 0);
    });
  }, [resolved, search, posFilters, rookiesOnly]);

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
            const active = pos === "ALL" ? posFilters.length === 0 && !rookiesOnly
              : pos === "ROOKIE" ? rookiesOnly : posFilters.includes(pos);
            const colors = pos !== "ALL" ? getPositionColors(pos) : null;
            return (
              <button
                key={pos}
                onClick={() => toggleFilter(pos)}
                aria-pressed={active}
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
      {isEditing && isOwner && <p className="px-4 py-2 text-xs text-[var(--text-muted)]">Drag any player row to reorder (press and hold on touch screens). Moves update overall ranks, even with filters applied.</p>}
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
            {(search || posFilters.length > 0 || rookiesOnly) && (
              <button
                onClick={() => { setSearch(""); toggleFilter("ALL"); }}
                className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          isEditing && isOwner && !isSaving ? (
            <SortableRankingRows key={JSON.stringify([search, posFilters, rookiesOnly])} players={filtered} onMove={onMove} />
          ) : filtered.map(entry => (
            <PlayerRow key={entry.player.id} {...entry} />
          ))
        )}
      </div>
    </div>
  );
};

export default RankingList;
