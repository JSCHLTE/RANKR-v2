import Link from "next/link";
import { RankObj, RankingMeta } from "@/types/rank";
import { getPositionColors } from "@/constants/positions";

  const POSITION_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SFLEX", "K", "DEF"];
  
  function getPositionLabels(rankObj: RankObj): string[] {
    return [...rankObj.positionGroup].sort(
        (a, b) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b)
      );
  }

  
  function buildTags(rankObj: RankObj) {
    const tags: string[] = [];
    if (rankObj.leagueSize) tags.push(`${rankObj.leagueSize} TEAMS`);
    if (rankObj.leagueType) tags.push(rankObj.leagueType);
    if (rankObj.scoring)    tags.push(rankObj.scoring);
    if (rankObj.rankType)   tags.push(rankObj.rankType);
    if (rankObj.onlyRookies) tags.push("ROOKIES");
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
    const { rankObj, createdAt, updatedAt, author, rankingId } = ranking;
    const positionLabels = getPositionLabels(rankObj);
    const tags = buildTags(rankObj);
    const formatEntries = rankObj.format
      ? Object.entries(rankObj.format)
      .filter(([, v]) => v && v > 0)
      .sort(([a], [b]) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b))
  : [];

    const wasEdited = updatedAt && createdAt && updatedAt !== createdAt;
    const isPrivate = rankObj.visibility === "PRIVATE";
  
    return (
      <Link href={`/rankings/${rankingId}`} className="block group h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
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
                {createdAt}
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
            {!wasEdited ? (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full text-[var(--text-muted)] bg-[var(--surface-hover)] border border-[var(--border)]">
                Created {createdAt}
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Updated {updatedAt}
              </span>
            )}
          </div>
  
        </article>
      </Link>
    );
  };