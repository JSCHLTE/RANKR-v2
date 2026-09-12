import Link from "next/link";
import { RankingMeta } from "@/types/rank";
import RosterTags from "./RosterTags";

export const RankingCard = ({ ranking }: { ranking: RankingMeta }) => {
  const { rankObj, createdAt, updatedAt, author, rankingId } = ranking;
  const tags = [rankObj.leagueSize ? `${rankObj.leagueSize} Teams` : null, rankObj.scoring].filter(Boolean);
  const hasUpdatedAt = updatedAt && updatedAt !== "—";

  return (
    <Link href={`/rankings/${rankingId}`} className="block group h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
      <article className="flex h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-200 group-hover:border-[var(--border-hover)] group-hover:bg-[var(--surface-hover)]">
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h2 className="text-base font-semibold leading-snug tracking-tight text-[var(--foreground)] break-words line-clamp-2">
              {rankObj.name}
            </h2>
            {rankObj.description && <p className="text-[13px] leading-relaxed text-[var(--text-muted)] line-clamp-2 break-words">
              {rankObj.description}
            </p>}
          </div>
          <RosterTags format={rankObj.format}>
            {tags.length > 0 && tags.map((tag, index) => <span key={index} className="inline-flex h-7 items-center rounded-md border border-[var(--border)] px-2.5 text-[11px] font-medium leading-none text-[var(--text-muted)]">
              {tag}
            </span>)}
          </RosterTags>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]" aria-label={`${ranking.likeCount ?? 0} likes`}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          <span>{ranking.likeCount ?? 0}</span>
        </div>
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-t border-[var(--border)] pt-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-muted)]">
              {author.pfp ? <img src={author.pfp} alt={`${author.username}'s profile picture`} className="h-full w-full object-cover" /> : (author.username?.[0]?.toUpperCase() ?? "?")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium leading-5 text-[var(--foreground)]">{author.displayName || author.username}</p>
              <p className="truncate text-[11px] leading-4 text-[var(--text-muted)]">@{author.username}</p>
            </div>
          </div>
          <span title={`Created ${createdAt}`} className={`inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-medium leading-none ${hasUpdatedAt ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
            {hasUpdatedAt ? `Updated ${updatedAt}` : `Created ${createdAt}`}
          </span>
        </footer>
      </article>
    </Link>
  );
};
