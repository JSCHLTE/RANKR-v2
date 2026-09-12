"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RankingMeta } from "@/types/rank";
import ProfilePicture from "@/components/profile/ProfilePicture";

interface Liker { uid: string; username: string; displayName: string; pfp: string }
export default function RankingLikes({ meta }: { meta: RankingMeta }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState({ liked: false, count: meta.likeCount ?? 0, uid: "" });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [people, setPeople] = useState<{ uid: string; users: Liker[] } | null>(null);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const owner = user?.uid === meta.author.uid;
  const liked = state.uid === user?.uid && state.liked;

  useEffect(() => {
    let active = true;
    setReady(false);
    setError("");
    dialog.current?.close();
    if (user) {
      user.getIdToken().then(token => fetch(`/api/likes?rankingId=${encodeURIComponent(meta.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }))
        .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
        .then(data => { if (active) { setState({ ...data, uid: user.uid }); setReady(true); } })
        .catch(() => { if (active) setError("Unable to load likes. Refresh to retry."); });
    }
    return () => { active = false; };
  }, [user, meta.id]);

  async function toggle() {
    if (!user) { router.push("/login"); return; }
    if (owner || inFlight.current || !ready) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/likes", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ rankingId: meta.id, liked: !liked }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ ...data, uid: user.uid });
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to update like."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  async function showPeople() {
    if (!user) { router.push("/login"); return; }
    dialog.current?.showModal();
    setPeople(null);
    setPeopleError("");
    setPeopleLoading(true);
    try {
      const response = await fetch(`/api/likes?rankingId=${encodeURIComponent(meta.id)}&users=true`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPeople({ uid: user.uid, users: data.users });
    } catch (error) { setPeopleError(error instanceof Error ? error.message : "Unable to load people."); }
    finally { setPeopleLoading(false); }
  }

  return <div className="mt-5">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={toggle} disabled={loading || busy || owner || (!!user && !ready)} aria-pressed={liked} aria-label={owner ? "You cannot like your own ranking" : liked ? "Unlike ranking" : user ? "Like ranking" : "Sign in to like ranking"} title={owner ? "You cannot like your own ranking" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors disabled:cursor-default disabled:opacity-50 ${liked ? "border-pink-500/30 bg-pink-500/10 text-pink-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"}`}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
        {busy ? "Saving…" : liked ? "Liked" : "Like"}
      </button>
      <button type="button" disabled={loading} onClick={showPeople} className="min-h-10 text-xs text-[var(--text-muted)] underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--foreground)]">Liked by {state.count} {state.count === 1 ? "person" : "people"}</button>
    </div>
    {error && <p role="alert" className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    <dialog ref={dialog} aria-labelledby="ranking-likers-title" className="fixed inset-0 m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-[var(--foreground)] shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between"><h2 id="ranking-likers-title" className="font-semibold">Liked by</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Close likes" className="h-10 w-10 rounded-full border border-[var(--border)]">×</button></div>
      {peopleLoading ? <p role="status" className="text-sm text-[var(--text-muted)]">Loading people…</p> : peopleError ? <p role="alert" className="text-sm text-[var(--danger)]">{peopleError}</p> : people?.uid === user?.uid && people?.users.length ? <ul className="space-y-2">{people.users.map(person => <li key={person.uid}><Link href={`/user/${encodeURIComponent(person.username)}`} onClick={() => dialog.current?.close()} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--surface-hover)]"><ProfilePicture src={person.pfp || "/lion-default-pfp.svg"} alt={`${person.displayName || person.username} profile picture`} className="h-10 w-10" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{person.displayName}</span><span className="block truncate text-xs text-[var(--text-muted)]">@{person.username}</span></span></Link></li>)}</ul> : <p className="text-sm text-[var(--text-muted)]">No likes yet.</p>}
    </dialog>
  </div>;
}

