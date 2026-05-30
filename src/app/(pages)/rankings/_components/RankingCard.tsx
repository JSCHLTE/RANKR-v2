import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { RankFormat, RankObj, RankingMeta } from "@/types/rank";

const POSITION_COLORS: Record<string, { bg: string; text: string; border: string; }> = {
    QB:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30"     },
    WR:    { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30"     },
    RB:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    TE:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30"  },
    FLEX:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30"  },
    SFLEX: { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30"    },
    K:     { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30"  },
    DEF:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30"   },
    DST:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30"   },
  };
  
  const DEFAULT_POSITION_COLORS = {
    bg: "bg-[var(--surface-hover)]",
    text: "text-[var(--foreground)]",
    border: "border-[var(--border)]",
  };
  
  function getPositionColors(pos: string) {
    return POSITION_COLORS[pos.toUpperCase()] ?? DEFAULT_POSITION_COLORS;
  }

function formatTimestamp(ts: Timestamp | undefined): string {
    if (!ts) return "—";
    return ts.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const POSITION_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SFLEX", "K", "DEF"];
  
  function getPositionLabels(rankObj: RankObj): string[] {
    if (
      rankObj.positionGroup?.toLowerCase() === "custom" &&
      rankObj.customPositions?.length
    ) {
      return [...rankObj.customPositions].sort(
        (a, b) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b)
      );
    }
    return [rankObj.positionGroup ?? "ALL"];
  }

  
  function buildTags(rankObj: RankObj) {
    const tags: string[] = [];
    if (rankObj.leagueSize) tags.push(`${rankObj.leagueSize} TEAMS`);
    if (rankObj.leagueType) tags.push(rankObj.leagueType);
    if (rankObj.scoring)    tags.push(rankObj.scoring);
    if (rankObj.rankType)   tags.push(rankObj.rankType);
    if (rankObj.mode)       tags.push(rankObj.mode);
    if (rankObj.onlyRookies) tags.push("Rookies Only");
    return tags;
  }
  
  const PositionBadge = ({ pos }: { pos: string }) => {
    const colors = getPositionColors(pos);
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
      >
        {pos}
      </span>
    );
  };
  
  const FormatSlot = ({ pos, count }: { pos: string; count: number }) => {
    const colors = getPositionColors(pos);
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] ${colors.bg} ${colors.border}`}>
        <span className={`font-semibold ${colors.text}`}>{pos}</span>
        <span className="font-bold text-[var(--foreground)]">{count}</span>
      </div>
    );
  };

export const RankingCard = ({ ranking }: { ranking: RankingMeta }) => {
    const { rankObj, createdAt, updatedAt, author } = ranking;
    const positionLabels = getPositionLabels(rankObj);
    const tags = buildTags(rankObj);
    const formatEntries = rankObj.format
      ? Object.entries(rankObj.format)
      .filter(([, v]) => v && v > 0)
      .sort(([a], [b]) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b))
  : [];
    const wasEdited = updatedAt && createdAt && updatedAt.seconds !== createdAt.seconds;
    const isPrivate = rankObj.visibility === "PRIVATE";
  
    return (
      <Link href="#" className="block group h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
        <article className="flex flex-col h-full rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 group-hover:border-[var(--border-hover)] group-hover:bg-[var(--surface-hover)] group-hover:-translate-y-0.5 group-hover:shadow-lg">
  
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text-muted)] overflow-hidden">
              <img src={author.pfp} alt={`${author.username}'s profile picture`}/>
            </div>
            {/* Author info */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[13px] font-medium text-[var(--foreground)] leading-none">
                @{author.username}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] leading-none">
                {formatTimestamp(createdAt)}
                {wasEdited && (
                  <span className="italic"> · edited</span>
                )}
              </span>
            </div>
          </div>
  
          {/* ── Body ── */}
          <div className="flex flex-col gap-3 px-4 py-4 flex-1">
  
            {/* Name */}
            <h2 className="text-[15px] font-semibold text-[var(--foreground)] leading-snug tracking-tight">
              {rankObj.name}
            </h2>
  
            {/* Description */}
            {rankObj.description && (
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                {rankObj.description}
              </p>
            )}
  
            {/* Position group — most important */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mr-0.5">
                Ranking
              </span>
              {positionLabels.map((pos) => (
                <PositionBadge key={pos} pos={pos} />
              ))}
            </div>
  
            {/* Format */}
            {formatEntries.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Roster
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {formatEntries.map(([pos, count]) => (
                    <FormatSlot key={pos} pos={pos} count={count as number} />
                  ))}
                </div>
              </div>
            )}
  
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] text-[var(--text-muted)] bg-[var(--surface-hover)] border border-[var(--border)] rounded-md px-2 py-1 leading-none"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
  
          {/* ── Footer ── */}
          <div className="flex items-center justify-end px-4 py-2.5 border-t border-[var(--border)]">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Private
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Public
              </span>
            )}
          </div>
  
        </article>
      </Link>
    );
  };