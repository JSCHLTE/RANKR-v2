"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GameOdds, GameSummary, OddsTeam } from "@/types/odds";
import { gameTime, updatedTime } from "./OddsValue";

function Logo({ team, large = false }: { team: OddsTeam; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={`flex shrink-0 items-center justify-center ${large ? "h-16 w-16 sm:h-20 sm:w-20" : "h-7 w-7"}`}>
    {failed ? <span className="text-xs font-semibold">{team.abbr}</span> : <Image unoptimized src={`https://sleepercdn.com/images/team_logos/nfl/${team.abbr.toLowerCase()}.png`} alt="" width={large ? 80 : 28} height={large ? 80 : 28} className="h-full w-full object-contain" onError={() => setFailed(true)} />}
  </span>;
}

function Kickoff({ startTime }: { startTime: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const minutes = now === null ? 0 : Math.ceil((Date.parse(startTime) - now) / 60000);
  const remaining = minutes >= 1440 ? `${Math.floor(minutes / 1440)} days` : minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  return <div className="text-center text-xs sm:text-sm">
    <p className="font-semibold">{minutes > 0 ? <>Starts in: <span className="text-yellow-300">{remaining}</span></> : "Scheduled kickoff"}</p>
    <time dateTime={startTime} className="mt-1 block text-white/75">{gameTime(startTime)}</time>
  </div>;
}

type HeaderGame = Pick<GameOdds, "season" | "week" | "eventId" | "slug" | "away" | "home" | "startTime" | "updatedAt" | "isMock">;
type HeaderMatchup = Omit<GameSummary, "sportsbooks">;

export function MatchupHeader({ game, games }: { game: HeaderGame; games: HeaderMatchup[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scroller.current;
    const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (container && active) container.scrollLeft = active.offsetLeft - container.offsetLeft - (container.clientWidth - active.clientWidth) / 2;
  }, [game.slug]);
  function scroll(direction: number) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.8, behavior: reducedMotion ? "instant" : "smooth" });
  }
  return <header className="mb-6">
    <nav aria-label={`Week ${game.week} matchups`} className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Link href={`/odds/nfl/${game.season}/week-${game.week}`} className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">← All Week {game.week} games</Link>
        <div className="flex gap-2">{([-1, 1] as const).map(direction => <button key={direction} type="button" aria-label={direction < 0 ? "Scroll games left" : "Scroll games right"} onClick={() => scroll(direction)} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] focus-visible:outline-[var(--accent)]"><span aria-hidden="true">{direction < 0 ? "←" : "→"}</span></button>)}</div>
      </div>
      <div ref={scroller} className="relative flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0} aria-label="Scrollable game list">
        {games.map(matchup => <Link key={matchup.eventId} href={`/odds/nfl/${game.season}/week-${game.week}/${matchup.slug}`} aria-current={matchup.slug === game.slug ? "page" : undefined} className={`w-56 shrink-0 snap-start rounded-2xl border p-3 transition-colors focus-visible:outline-[var(--accent)] ${matchup.slug === game.slug ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"}`}>
          <time dateTime={matchup.startTime} className="mb-2 block text-[11px] text-[var(--text-muted)]">{gameTime(matchup.startTime)}</time>
          {[matchup.away, matchup.home].map(team => <span key={team.abbr} className="mt-1 flex items-center gap-2 text-sm font-semibold"><Logo team={team} /><span>{team.name}</span></span>)}
        </Link>)}
      </div>
    </nav>
    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">NFL odds · {game.season} · Week {game.week}</p>
    <div className="relative isolate overflow-hidden rounded-2xl bg-[#080b10] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2" style={{ background: `linear-gradient(115deg, var(--${game.away.abbr.toLowerCase()}, #334155), transparent 90%)` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-1/2" style={{ background: `linear-gradient(245deg, var(--${game.home.abbr.toLowerCase()}, #334155), transparent 90%)` }} />
      <h1 className="sr-only">{game.away.name} at {game.home.name}</h1>
      <div className="grid min-h-48 grid-cols-[1fr_1.15fr_1fr] items-center gap-2 px-3 py-8 sm:gap-6 sm:px-8">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center"><Logo key={game.away.abbr} team={game.away} large /><p className="text-sm font-semibold sm:text-lg">{game.away.name}</p></div>
        <Kickoff key={game.eventId} startTime={game.startTime} />
        <div className="flex min-w-0 flex-col items-center gap-3 text-center"><Logo key={game.home.abbr} team={game.home} large /><p className="text-sm font-semibold sm:text-lg">{game.home.name}</p></div>
      </div>
    </div>
    <p className="mt-3 text-xs text-[var(--text-muted)]">{game.isMock ? "Mock data · " : ""}Last updated {updatedTime(game.updatedAt)}</p>
  </header>;
}

