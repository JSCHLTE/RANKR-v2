import Link from "next/link";
import { notFound } from "next/navigation";
import { loadGameOdds } from "@/lib/odds/loadOdds";
import { OddsPageHeader } from "@/components/odds/OddsPageHeader";
import { SportsbookFilter } from "@/components/odds/OddsPreferences";
import { GameLines } from "@/components/odds/GameLines";
import { PlayerProps } from "@/components/odds/PlayerProps";
import { gameTime } from "@/components/odds/OddsValue";
import { TeamMatchup } from "@/components/odds/TeamMatchup";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ season: string; week: string; game: string }> }) {
  const { season, week, game } = await params;
  const data = await loadGameOdds(season, week, game);
  return { title: data ? `${data.away.abbr} @ ${data.home.abbr} Odds | RANKR` : "Game not found | RANKR" };
}
export default async function GamePage({ params }: { params: Promise<{ season: string; week: string; game: string }> }) {
  const { season, week, game } = await params;
  const data = await loadGameOdds(season, week, game);
  if (!data) notFound();
  return <><Link className="mb-6 inline-block text-sm text-[var(--text-muted)] hover:text-[var(--accent)]" href={`/odds/nfl/${season}/${week}`}>← All Week {data.week} games</Link>
    <OddsPageHeader title={<TeamMatchup away={data.away} home={data.home} />} {...data} />
    <p className="mb-2 text-sm">{data.away.name} at {data.home.name}</p><time dateTime={data.startTime} className="mb-6 block text-sm text-[var(--text-muted)]">{gameTime(data.startTime)}</time>
    <SportsbookFilter /><GameLines books={data.gameOdds} away={data.away.abbr} home={data.home.abbr} /><PlayerProps props={data.playerProps} />
  </>;
}
