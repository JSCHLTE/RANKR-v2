"use client";

import { SkeletonCard } from "../_components/SkeletonCard";
import { RankingCard } from "../_components/RankingCard";
import { RankingMeta } from "@/types/rank";

interface Props {
    rankings: RankingMeta[],
    loading: boolean
}

const RankingFeed = ({ rankings, loading }: Props) => {

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 sm:px-6 py-10">
    <div className="max-w-5xl mx-auto">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
          Community Rankings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Browse rankings shared by the community
        </p>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankings.map((ranking) => (
            <RankingCard key={ranking.id} ranking={ranking} />
          ))}
        </div>
      )}

    </div>
  </div>
  )
}

export default RankingFeed