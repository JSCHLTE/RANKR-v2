"use client";

import { useState } from "react";
import SkeletonCard from "../_components/SkeletonCard";
import { RankingCard } from "../_components/RankingCard";
import { RankingMeta } from "@/types/rank";

interface Props {
  rankings: RankingMeta[];
  loading: boolean;
}

type SortOrder = "newest" | "oldest" | "most-liked";

const RankingFeed = ({ rankings, loading }: Props) => {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const query = search.trim().toLowerCase();
  const filteredRankings = rankings
    .filter((ranking) =>
      (ranking.rankObj?.name ?? "").toLowerCase().includes(query) ||
      (ranking.author?.username ?? "").toLowerCase().includes(query) ||
      `@${ranking.author?.username ?? ""}`.toLowerCase().includes(query)
    )
    .sort((a, b) => {
      if (sortOrder === "most-liked") {
        return (b.likeCount ?? 0) - (a.likeCount ?? 0) || (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
      }
      return sortOrder === "oldest"
        ? (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0)
        : (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
    });

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="relative isolate mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111b1b] text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(0,118,65,0.34),transparent_48%),linear-gradient(115deg,#172122_0%,#111a1d_58%,#0a3026_100%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rotate-45 border border-emerald-400/5 bg-emerald-500/[0.035]" />
          <div className="relative px-6 py-9 sm:px-9 sm:py-11">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Community <span className="text-emerald-400">Rankings</span>
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Browse and discover rankings shared by the RANKR community.
            </p>
          </div>
        </header>

        <div className="mb-7 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="rankings-search" className="sr-only">Search rankings by username or ranking title</label>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 focus-within:ring-2 focus-within:ring-[var(--accent)]">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0 text-[var(--text-muted)]">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" />
            </svg>
            <input id="rankings-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by username or ranking title..."
              className="min-w-0 w-full bg-transparent py-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)]" />
          </div>
          <label htmlFor="rankings-sort" className="sr-only">Sort community rankings</label>
          <div className="relative shrink-0 sm:w-48">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <path d="M7 3v14m0 0-3-3m3 3 3-3M17 21V7m0 0-3 3m3-3 3 3" />
            </svg>
            <select id="rankings-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="h-full min-h-14 w-full cursor-pointer appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-10 text-sm font-medium text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-liked">Most Liked</option>
            </select>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </div>

        {!loading && query && <p role="status" className="mb-4 text-sm text-[var(--text-muted)]">
          {filteredRankings.length} {filteredRankings.length === 1 ? "ranking" : "rankings"} found
        </p>}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[15px] font-semibold text-[var(--foreground)]">No rankings yet</p>
            <p className="text-[13px] text-[var(--text-muted)]">Be the first to share a ranking with the community.</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-[15px] font-semibold text-[var(--foreground)]">No matching rankings</p>
            <p className="text-[13px] text-[var(--text-muted)]">Try a different username or ranking title.</p>
            <button type="button" onClick={() => setSearch("")} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRankings.map((ranking) => <RankingCard key={ranking.id} ranking={ranking} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingFeed;
