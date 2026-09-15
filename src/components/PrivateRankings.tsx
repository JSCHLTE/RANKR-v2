"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { RankingMeta } from "@/types/rank";
import RankingView from "@/app/(pages)/rankings/[slug]/RankingView";
import { RankingCard } from "@/app/(pages)/rankings/_components/RankingCard";

interface Result { meta?: RankingMeta; ranks?: { player_id: string; rank: number }[]; rankings?: RankingMeta[] }
export function PrivateRankings({ rankingId, profileUid }: { rankingId?: string; profileUid?: string }) {
  const { user, loading } = useAuth();
  const [result, setResult] = useState<{ key: string; data?: Result; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const key = `${user?.uid ?? ""}:${rankingId ?? "list"}:${attempt}`;
  const allowed = !!user && (!profileUid || profileUid === user.uid);
  useEffect(() => {
    if (loading || !user || !allowed) return;
    const controller = new AbortController();
    async function load() {
      try {
        const token = await user!.getIdToken();
        if (controller.signal.aborted) return;
        const response = await fetch(`/api/private-rankings${rankingId ? `?id=${encodeURIComponent(rankingId)}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load ranking.");
        if (!controller.signal.aborted) setResult({ key, data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, error: error instanceof Error ? error.message : "Unable to load ranking." });
      }
    }
    void load();
    return () => controller.abort();
  }, [user, loading, allowed, rankingId, key]);

  if (profileUid && !allowed) return null;
  if (loading) return <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Checking access…</p>;
  if (!user) return <div className="py-10"><h1 className="text-2xl font-semibold">Owner access required</h1><p className="mt-3 text-[var(--text-muted)]">Sign in with the account that owns this ranking to view it.</p><Link href="/login" className="mt-4 inline-block text-[var(--accent)]">Sign in</Link></div>;
  const current = result?.key === key ? result : undefined;
  if (!current) return <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading your private rankings…</p>;
  if (current.error) return <div className="py-6"><p role="alert">{current.error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-3 cursor-pointer text-[var(--accent)]">Try again</button></div>;
  if (rankingId && current.data?.meta) return <RankingView key={key} meta={current.data.meta} ranks={current.data.ranks ?? []} />;
  const rankings = current.data?.rankings ?? [];
  return <section className="mt-8"><h2 className="mb-2 text-xl font-semibold">Your private rankings</h2><p className="mb-5 text-sm text-[var(--text-muted)]">Only you can view and edit these rankings.</p>{rankings.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{rankings.map(ranking => <RankingCard key={ranking.id} ranking={ranking} />)}</div> : <p className="text-sm text-[var(--text-muted)]">You haven’t created any private rankings yet.</p>}</section>;
}
