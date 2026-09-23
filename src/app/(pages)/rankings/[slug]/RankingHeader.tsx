"use client";

import RankrPassBadge from "@/components/RankrPassBadge";
import { RankingMeta } from "@/types/rank";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import RankingLikes from "@/components/RankingLikes";
import { DraftModeButton } from "@/components/DraftMode";
import RosterTags from "../_components/RosterTags";

interface Props {
  meta: RankingMeta;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: "name" | "description", value: string) => void;
}

const actionClass = "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/10 px-4 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-50";

export default function RankingHeader({ meta, onEdit, onDelete, isEditing, isSaving, isDeleting, onSave, onCancel, onChange }: Props) {
  const { user } = useAuth();
  const { rankObj, author, createdAt, updatedAt } = meta;
  const isOwner = user?.uid === author.uid;
  const tags = [rankObj.scoring, rankObj.leagueSize ? `${rankObj.leagueSize} Teams` : null].filter(Boolean);

  return <div className="pb-6 pt-6 sm:pt-8">
    <section className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#111b1b] text-slate-100 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(0,118,65,0.34),transparent_48%),linear-gradient(115deg,#172122_0%,#111a1d_58%,#0a3026_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rotate-45 border border-emerald-400/5 bg-emerald-500/[0.035]" />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:gap-6 sm:p-7">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/70 bg-emerald-500/[0.06] sm:h-24 sm:w-24">
          <Image src="/lion-green-t.svg" alt="Rankr lion" width={76} height={76} className="h-[4.25rem] w-[4.25rem] object-contain sm:h-20 sm:w-20" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              {isEditing && isOwner ? <div className="space-y-2">
                <input aria-label="Ranking title" value={rankObj.name} maxLength={200} disabled={isSaving}
                  onChange={event => onChange("name", event.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-2xl font-bold text-white focus:border-emerald-400 focus:outline-none" />
                <textarea aria-label="Ranking description" placeholder="Add a description..." value={rankObj.description ?? ""} maxLength={5000} rows={3} disabled={isSaving}
                  onChange={event => onChange("description", event.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-black/25 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none" />
              </div> : <>
                <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">{rankObj.name}</h1>
                {rankObj.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">{rankObj.description}</p>}
              </>}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
                <Link href={`/user/${author.username}`} className="inline-flex items-center gap-2 font-semibold text-white transition-opacity hover:opacity-80">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-emerald-600 text-xs">
                    {author.pfp ? <Image src={author.pfp} alt="" width={28} height={28} unoptimized className="h-full w-full object-cover" /> : (author.username?.[0]?.toUpperCase() ?? "?")}
                  </span>
                  <span>{author.displayName || author.username} <RankrPassBadge pass={author.rankrPass} /></span>
                </Link>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span title={`Created ${createdAt}`}>{updatedAt && updatedAt !== "—" ? `Updated ${updatedAt}` : `Created ${createdAt}`}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {!isEditing && <button type="button" title="Download as CSV" aria-label="Download as CSV" className={`${actionClass} px-3`}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
              </button>}
              {isOwner && (isEditing ? <>
                <button type="button" onClick={onSave} disabled={isSaving || !rankObj.name.trim()} className={`${actionClass} border-emerald-500/50 text-emerald-300`}>{isSaving ? "Saving..." : "Save"}</button>
                <button type="button" onClick={onCancel} disabled={isSaving} className={actionClass}>Cancel</button>
              </> : <>
                <button type="button" onClick={onEdit} disabled={isDeleting || !onEdit} title="Edit ranking" className={actionClass}>
                  <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                <button type="button" onClick={onDelete} disabled={isDeleting} aria-busy={isDeleting} title="Delete ranking" className={`${actionClass} border-red-500/50 text-red-400 hover:bg-red-500/10`}>
                  <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6m4-6v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </>)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {rankObj.visibility === "PUBLIC" ? <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 text-sm text-emerald-300">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>Public
            </span> : <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 text-sm text-amber-300">
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>Private
            </span>}
            <RankingLikes meta={meta} compact />
          </div>
        </div>
      </div>
    </section>

    <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <RosterTags format={rankObj.format}>
        {tags.map((tag, index) => <span key={index} className="inline-flex h-7 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[11px] font-medium text-[var(--text-muted)]">{tag}</span>)}
      </RosterTags>
      <div className="lg:ml-auto lg:shrink-0"><DraftModeButton /></div>
    </div>
  </div>;
}
