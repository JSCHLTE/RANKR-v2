"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { GameOdds, WeekOdds } from "@/types/odds";
import { hasActiveRankrPass, type RankrPass } from "@/lib/rankr-pass";
import { OddsPageHeader } from "./OddsPageHeader";
import { WeekSelector } from "./WeekSelector";
import { SportsbookFilter } from "./OddsPreferences";
import { GameOddsCard } from "./GameOddsCard";
import { AdminOddsSync } from "./AdminOddsSync";
import { MatchupHeader } from "./MatchupHeader";
import { GameLines } from "./GameLines";
import { PlayerProps } from "./PlayerProps";

interface Result { week: WeekOdds; weeks?: number[]; game?: GameOdds; pass: RankrPass }

export default function ProtectedOdds({ season, week, game }: { season: string; week: string; game?: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const key = `${user?.uid}:${season}:${week}:${game}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data?: Result; error?: string }>();
  const current = result?.key === key ? result : undefined;
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/signup"); return; }
    const controller = new AbortController();
    async function load() {
      try {
        const token = await user!.getIdToken();
        if (controller.signal.aborted) return;
        const query = new URLSearchParams({ season, week, ...(game ? { game } : {}) });
        const response = await fetch(`/api/odds?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) { router.replace("/signup"); return; }
        if (response.status === 403) { router.replace("/subscribe"); return; }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load odds.");
        if (!controller.signal.aborted) setResult({ key, data });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, error: error instanceof Error ? error.message : "Unable to load odds." });
      }
    }
    void load();
    return () => controller.abort();
  }, [user, loading, season, week, game, key, router]);

  // Remove an open game when its paid period ends, including after tab suspension.
  useEffect(() => {
    if (!game || !current?.data) return;
    const check = () => {
      if (!hasActiveRankrPass(current.data!.pass)) { setResult(undefined); router.replace("/subscribe"); }
    };
    const timer = window.setInterval(check, 1000);
    window.addEventListener("focus", check);
    return () => { clearInterval(timer); window.removeEventListener("focus", check); };
  }, [game, current, router]);

  if (loading || !user || !current) return <p role="status" className="text-sm text-[var(--text-muted)]">Checking access…</p>;
  if (current.error) return <div><p role="alert">{current.error}</p><button onClick={() => setAttempt(value => value + 1)} className="mt-3 cursor-pointer text-[var(--accent)]">Try again</button></div>;
  const data = current.data!;
  const sync = <AdminOddsSync season={data.week.season} week={data.week.week} onUpdated={() => setAttempt(value => value + 1)} />;
  if (data.game) {
    const match = data.game;
    return <><MatchupHeader game={match} games={data.week.games} />{sync}<SportsbookFilter /><GameLines books={match.gameOdds} away={match.away.abbr} home={match.home.abbr} /><PlayerProps props={match.playerProps} /></>;
  }
  return <><OddsPageHeader title="NFL odds" {...data.week} />{sync}<SportsbookFilter><WeekSelector season={data.week.season} week={data.week.week} weeks={data.weeks ?? []} /></SportsbookFilter>
    {data.week.games.length ? <div className="grid gap-4 lg:grid-cols-2">{data.week.games.map(match => <GameOddsCard key={match.eventId} game={match} season={data.week.season} week={data.week.week} pass={data.pass} />)}</div> : <p className="rounded-2xl bg-[var(--surface)] p-6">No games available for this week.</p>}
  </>;
}
