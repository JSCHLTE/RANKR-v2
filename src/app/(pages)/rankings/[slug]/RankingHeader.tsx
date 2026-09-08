"use client";

import { RankingMeta } from "@/types/rank";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Tag {
  label?: string;
  value: string;
}

function buildTags(meta: RankingMeta): Tag[] {
  const { rankObj } = meta;
  const tags: Tag[] = [];
  if (rankObj.scoring)    tags.push({ value: rankObj.scoring });
  if (rankObj.leagueSize) tags.push({ value: `${rankObj.leagueSize} Teams` });
  return tags;
}

//Props

interface Props {
  meta: RankingMeta;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: "name" | "description", value: string) => void;
}

//Component

const RankingHeader = ({ meta, onEdit, onDelete, isEditing, isSaving, onSave, onCancel, onChange }: Props) => {
  const { user } = useAuth();
  const { rankObj, author, createdAt, updatedAt } = meta;
  const isOwner = user?.uid === author.uid;
  const tags = buildTags(meta);
  const badgeClass = "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium leading-none";

  return (
    <div className="py-8">

      {/* Top row: title + actions */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        <div className="w-full flex-1 min-w-0">
          {isEditing && isOwner ? <div className="space-y-2">
            <input aria-label="Ranking title" value={rankObj.name} maxLength={200} disabled={isSaving}
              onChange={event => onChange("name", event.target.value)}
              className="w-full text-2xl font-semibold leading-tight tracking-tight rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] px-3 py-2 focus:outline-none focus:border-[var(--accent)]" />
            <textarea aria-label="Ranking description" placeholder="Add a description..." value={rankObj.description ?? ""} maxLength={5000} rows={3} disabled={isSaving}
              onChange={event => onChange("description", event.target.value)}
              className="w-full text-sm leading-relaxed rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] px-3 py-2 focus:outline-none focus:border-[var(--accent)]" />
          </div> : <>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] leading-tight tracking-tight mb-2">
            {rankObj.name}
          </h1>
          {rankObj.description && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xl">
              {rankObj.description}
            </p>
          )}
          </>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Author */}
            <Link href={`/user/${author.username}`} className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
                {author.pfp ? (
                  <img src={author.pfp} alt={author.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--surface-hover)] flex items-center justify-center text-[10px] font-medium text-[var(--text-muted)]">
                    {author.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {author.displayName || author.username}
              </span>
            </Link>

            <span className="text-xs text-[var(--text-muted)]" title={`Created ${createdAt}`}>
              {updatedAt && updatedAt !== "—" ? `Updated ${updatedAt}` : `Created ${createdAt}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1">
        <button
              title="Download as CSV"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /><path d="M12 3V16M12 16L16 11.625M12 16L8 11.625" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>     
            </button>
        {isOwner && (isEditing ? <>
          <button onClick={onSave} disabled={isSaving || !rankObj.name.trim()} className="text-sm px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--surface-hover)] disabled:opacity-50 cursor-pointer">{isSaving ? "Saving..." : "Save"}</button>
          <button onClick={onCancel} disabled={isSaving} className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-50 cursor-pointer">Cancel</button>
        </> : (
          <>
            <button
              onClick={onEdit}
              title="Edit ranking"
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
              title="Delete ranking"
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
            </>
        ))}
        </div>
        </div>

      {/* Ranking details */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {/* Neutral tags */}
        {tags.map((tag, i) => (
          <span
            key={i}
            className={`${badgeClass} text-[var(--text-muted)] bg-[var(--surface)] border-[var(--border)]`}
          >
            {tag.value}
          </span>
        ))}

        {/* Visibility */}
        {rankObj.visibility === "PUBLIC" ? (
          <span className={`${badgeClass} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Public
          </span>
        ) : (
          <span className={`${badgeClass} bg-amber-500/10 text-amber-400 border-amber-500/30`}>
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
