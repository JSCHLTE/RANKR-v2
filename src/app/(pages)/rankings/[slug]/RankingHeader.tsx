"use client";

import { RankingMeta } from "@/types/rank";
import { useAuth } from "@/context/AuthContext";
import { getPositionColors } from "@/constants/positions";
import Link from "next/link";

interface Tag {
  label?: string;
  value: string;
}

function buildTags(meta: RankingMeta): Tag[] {
  const { rankObj } = meta;
  const tags: Tag[] = [];
  if (rankObj.scoring)    tags.push({ value: rankObj.scoring });
  if (rankObj.leagueType) tags.push({ value: rankObj.leagueType });
  if (rankObj.leagueSize) tags.push({ value: `${rankObj.leagueSize} Teams` });
  if (rankObj.rankType)   tags.push({ value: rankObj.rankType });
  if (rankObj.onlyRookies) tags.push({ value: "Rookies Only" });
  return tags;
}

// ─── Position Badge ───────────────────────────────────────────────────────────

const PositionBadge = ({ pos }: { pos: string }) => {
  const colors = getPositionColors(pos);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
      {pos}
    </span>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  meta: RankingMeta;
  onEdit?: () => void;
  onDelete?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const RankingHeader = ({ meta, onEdit, onDelete }: Props) => {
  const { user } = useAuth();
  const { rankObj, author, createdAt } = meta;
  const isOwner = user?.uid === author.uid;
  const tags = buildTags(meta);

  return (
    <div className="py-8">

      {/* Top row: title + actions */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] leading-tight tracking-tight mb-1.5">
            {rankObj.name}
          </h1>
          {rankObj.description && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
              {rankObj.description}
            </p>
          )}
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)] mb-4" />

      {/* Meta row: avatar + author + date + tags */}
      <div className="flex items-center flex-wrap gap-2">

        {/* Author */}
        <Link href ={`/user/${author.username}`} className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
            {author.pfp ? (
              <img src={author.pfp} alt={author.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center text-[10px] font-medium text-[var(--text-muted)]">
                {author.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">
            {author.displayName ?? author.username}
          </span>
        </Link>

        {/* Dot */}
        <span className="w-1 h-1 rounded-full bg-[var(--border-hover)]" />

        {/* Date */}
        <span className="text-xs text-[var(--text-muted)]">
          {createdAt}
        </span>

        {/* Dot */}
        <span className="w-1 h-1 rounded-full bg-[var(--border-hover)]" />

        {/* Position badges */}
        {rankObj.positionGroup.map((pos) => (
          <PositionBadge key={pos} pos={pos} />
        ))}

        {/* Neutral tags */}
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-[11px] text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-2.5 py-1 leading-none"
          >
            {tag.value}
          </span>
        ))}

        {/* Visibility */}
        {rankObj.visibility === "PUBLIC" ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Public
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Private
          </span>
        )}
      </div>
    </div>
  );
};

export default RankingHeader;