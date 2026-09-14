"use client";
import Link from "next/link";
import type { GameSummary } from "@/types/odds";
import { selectGameMarkets } from "@/lib/odds/consensus";
import { ConsensusBadge, useOddsPreferences } from "./OddsPreferences";
import { MarketSummary } from "./GameLines";
import { gameTime } from "./OddsValue";
import { TeamMatchup } from "./TeamMatchup";
export function GameOddsCard({ game, season, week }: { game: GameSummary; season: number; week: number }) {
  const { preferences } = useOddsPreferences();
  return <Link href={`/odds/nfl/${season}/week-${week}/${game.slug}`} className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:p-5">
    <div className="mb-4 flex items-center justify-between gap-2"><time dateTime={game.startTime} className="text-xs text-[var(--text-muted)]">{gameTime(game.startTime)}</time><ConsensusBadge /></div>
    <h2><TeamMatchup away={game.away} home={game.home} /></h2>
    <p className="mb-5 mt-1 text-xs text-[var(--text-muted)]">{game.away.name} at {game.home.name}</p>
    <MarketSummary markets={selectGameMarkets(game.sportsbooks, preferences)} away={game.away.abbr} home={game.home.abbr} />
    <p className="mt-5 text-xs font-medium text-[var(--accent)]">Compare lines & player props →</p>
  </Link>;
}
