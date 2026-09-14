import { notFound } from "next/navigation";
import { availableWeeks, loadWeekOdds } from "@/lib/odds/loadOdds";
import { OddsPageHeader } from "@/components/odds/OddsPageHeader";
import { WeekSelector } from "@/components/odds/WeekSelector";
import { SportsbookFilter } from "@/components/odds/OddsPreferences";
import { GameOddsCard } from "@/components/odds/GameOddsCard";
export const dynamic = "force-dynamic";
export const metadata = { title: "NFL Odds | RANKR" };
export default async function WeekPage({ params }: { params: Promise<{ season: string; week: string }> }) {
  const { season, week } = await params;
  const data = await loadWeekOdds(season, week);
  if (!data) notFound();
  const weeks = await availableWeeks(season);
  return <><OddsPageHeader title="NFL odds" {...data} /><SportsbookFilter><WeekSelector season={data.season} week={data.week} weeks={weeks} /></SportsbookFilter>
    {data.games.length ? <div className="grid gap-4 lg:grid-cols-2">{data.games.map(game => <GameOddsCard key={game.eventId} game={game} season={data.season} week={data.week} />)}</div> : <p className="rounded-2xl bg-[var(--surface)] p-6">No games available for this week.</p>}
  </>;
}
