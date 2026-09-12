"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RankingMeta } from "@/types/rank";
import { RankingCard } from "../rankings/_components/RankingCard";

export default function LikesPage() {
  const { user, loading } = useAuth();
  const [result, setResult] = useState<{ uid: string; rankings: RankingMeta[] } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;

    if (user) user.getIdToken().then(token => fetch("/api/likes", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }))
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then(data => { if (active) setResult({ uid: user.uid, rankings: data.rankings }); })
      .catch(error => { if (active) setError(error.message || "Unable to load likes."); });
    return () => { active = false; };
  }, [user, attempt]);
  return <main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-2xl font-semibold tracking-tight">Your likes</h1><p className="mb-8 mt-2 text-sm text-[var(--text-muted)]">The rankings you’ve given a heart.</p>
    {loading ? <p role="status">Loading…</p> : !user ? <p className="text-sm text-[var(--text-muted)]"><Link href="/login" className="text-[var(--accent)] underline">Sign in</Link> to see your liked rankings.</p> : error ? <div role="alert"><p>{error}</p><button onClick={() => { setError(""); setAttempt(value => value + 1); }} className="mt-3 text-[var(--accent)]">Try again</button></div> : result?.uid !== user.uid ? <p role="status">Loading likes…</p> : result.rankings.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.rankings.map(ranking => <RankingCard key={ranking.id} ranking={ranking} />)}</div> : <div className="rounded-2xl border border-[var(--border)] p-10 text-center"><p className="font-medium">Your favorites start here.</p><p className="mt-2 text-sm text-[var(--text-muted)]">Heart a ranking to find it here later.</p><Link href="/rankings" className="mt-5 inline-block text-sm text-[var(--accent)]">Explore rankings</Link></div>}
  </main>;
}

