import RankrPassBadge from "@/components/RankrPassBadge";
import Link from "next/link";
import Image from "next/image";
import { RankFormat, RankingMeta } from "@/types/rank";
import RosterTags from "./RosterTags";

const CARD_TONES = {
  green: "border-emerald-500/20 bg-[radial-gradient(ellipse_at_20%_0%,rgba(0,100,65,0.33),transparent_60%),linear-gradient(145deg,#172122,#171e24)] hover:border-emerald-400/45",
  blue: "border-sky-500/20 bg-[radial-gradient(ellipse_at_20%_0%,rgba(15,87,153,0.36),transparent_60%),linear-gradient(145deg,#17202a,#171e24)] hover:border-sky-400/45",
  pink: "border-pink-500/20 bg-[radial-gradient(ellipse_at_20%_0%,rgba(122,48,143,0.31),transparent_60%),linear-gradient(145deg,#211b2b,#171e24)] hover:border-pink-400/45",
};

function cardTone(format: RankFormat | null): keyof typeof CARD_TONES {
  if (!format) return "green";
  const qb = format.QB ?? 0;
  const rb = format.RB ?? 0;
  const wr = format.WR ?? 0;
  const te = format.TE ?? 0;
  const flex = format.FLEX ?? 0;
  const sflex = format.SFLEX ?? 0;

  if (qb === 1 && rb === 2 && wr === 2 && te === 1 && flex === 0 && sflex === 1) return "pink";
  if (qb === 1 && rb === 2 && te === 1 && sflex === 0 &&
    ((wr === 2 && flex === 2) || (wr === 3 && flex === 1))) return "blue";
  return "green";
}

export const RankingCard = ({ ranking }: { ranking: RankingMeta }) => {
  const { rankObj, createdAt, updatedAt, author, rankingId } = ranking;
  const tags = [rankObj.leagueSize ? `${rankObj.leagueSize} Teams` : null, rankObj.scoring].filter(Boolean);
  const hasUpdatedAt = updatedAt && updatedAt !== "—";

  return (
    <Link href={`/rankings/${rankingId}`} className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
      <article className={`relative flex h-full min-h-80 flex-col overflow-hidden rounded-2xl border p-5 text-slate-100 shadow-[0_12px_36px_rgba(0,0,0,0.12)] transition-colors duration-200 sm:p-6 ${CARD_TONES[cardTone(rankObj.format)]}`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rotate-45 border border-white/5 bg-white/[0.025]" />
        <div className="relative flex flex-1 flex-col">
          <div className="mb-5 flex items-center justify-between gap-3">
            {rankObj.visibility === "PUBLIC" ? (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>
                Public
              </span>
            ) : (
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-amber-300">
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Private
              </span>
            )}
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-black/15 px-3 text-xs text-slate-200" aria-label={`${ranking.likeCount ?? 0} likes`}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
              {ranking.likeCount ?? 0}
            </span>
          </div>

          <h2 className="line-clamp-2 break-words text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">{rankObj.name}</h2>
          {rankObj.description && <p className="mt-2 line-clamp-2 break-words text-sm leading-relaxed text-slate-300">{rankObj.description}</p>}

          <div className="mt-5">
            <RosterTags format={rankObj.format} onDark>
              {tags.map((tag, index) => <span key={index} className="inline-flex h-7 items-center rounded-md border border-white/15 bg-black/10 px-2.5 text-[11px] font-medium leading-none text-slate-300">{tag}</span>)}
            </RosterTags>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-3 pt-5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-emerald-600/50 text-sm font-semibold text-white">
                {author.pfp ? <Image src={author.pfp} alt={`${author.username}'s profile picture`} width={40} height={40} unoptimized className="h-full w-full object-cover" /> : (author.username?.[0]?.toUpperCase() ?? "?")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold leading-5 text-white">{author.displayName || author.username} <RankrPassBadge pass={author.rankrPass} /></p>
                <p className="truncate text-[11px] leading-4 text-slate-300">@{author.username}</p>
              </div>
            </div>
            <span title={`Created ${createdAt}`} className="shrink-0 text-[11px] text-slate-300">
              {hasUpdatedAt ? `Updated ${updatedAt}` : `Created ${createdAt}`}
            </span>
          </footer>
        </div>
      </article>
    </Link>
  );
};
