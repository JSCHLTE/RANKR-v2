"use client";

import { useState } from "react";
import SkeletonCard from "../_components/SkeletonCard";
import { RankingCard } from "../_components/RankingCard";
import { RankingMeta } from "@/types/rank";

interface Props {
    rankings: RankingMeta[],
    loading: boolean
}

const RankingFeed = ({ rankings, loading }: Props) => {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filteredRankings = rankings.filter((ranking) =>
    (ranking.rankObj?.name ?? "").toLowerCase().includes(query) ||
    (ranking.author?.username ?? "").toLowerCase().includes(query) ||
    `@${ranking.author?.username ?? ""}`.toLowerCase().includes(query)
  );

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 py-10">
    <div className="max-w-5xl mx-auto">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Community Rankings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Browse rankings shared by the community.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="rankings-search" className="sr-only">
          Search rankings by username or ranking title
        </label>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 focus-within:ring-2 focus-within:ring-[var(--accent)]">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-[var(--text-muted)]">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            id="rankings-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username or ranking title"
            className="min-w-0 w-full bg-transparent py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
        {!loading && query && (
          <p role="status" className="mt-2 text-sm text-[var(--text-muted)]">
            {filteredRankings.length} {filteredRankings.length === 1 ? "ranking" : "rankings"} found
          </p>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-[var(--foreground)]">No rankings yet</p>
          <p className="text-[13px] text-[var(--text-muted)]">
            Be the first to share a ranking with the community.
          </p>
        </div>
      ) : filteredRankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <p className="text-[15px] font-semibold text-[var(--foreground)]">No matching rankings</p>
          <p className="text-[13px] text-[var(--text-muted)]">Try a different username or ranking title.</p>
          <button type="button" onClick={() => setSearch("")} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRankings.map((ranking) => (
            <RankingCard key={ranking.id} ranking={ranking} />
          ))}
        </div>
      )}

    </div>
  </div>
  )
}

export default RankingFeed
