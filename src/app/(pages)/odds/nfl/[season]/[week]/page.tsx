import { notFound } from "next/navigation";
import { availableWeeks, loadWeekOdds, validWeek } from "@/lib/odds/loadOdds";
import { OddsPageHeader } from "@/components/odds/OddsPageHeader";
import { WeekSelector } from "@/components/odds/WeekSelector";
import { SportsbookFilter } from "@/components/odds/OddsPreferences";
import { GameOddsCard } from "@/components/odds/GameOddsCard";
import { AdminOddsSync } from "@/components/odds/AdminOddsSync";
export const dynamic = "force-dynamic";
export const metadata = { title: "NFL Odds | RANKR" };
export default async function WeekPage({ params }: { params: Promise<{ season: string; week: string }> }) {
  const { season, week } = await params;
  if (!validWeek(season, week)) notFound();
  const [published, weeks] = await Promise.all([loadWeekOdds(season, week), availableWeeks(season)]);
  const data = published ?? { season: Number(season), week: Number(week.slice(5)), updatedAt: "", isMock: false, games: [] };
  return <><OddsPageHeader title="NFL odds" {...data} /><AdminOddsSync key={`${season}-${week}`} season={data.season} week={data.week} /><SportsbookFilter><WeekSelector season={data.season} week={data.week} weeks={weeks} /></SportsbookFilter>
    {data.games.length ? <div className="grid gap-4 lg:grid-cols-2">{data.games.map(game => <GameOddsCard key={game.eventId} game={game} season={data.season} week={data.week} />)}</div> : <p className="rounded-2xl bg-[var(--surface)] p-6">No games available for this week.</p>}
  </>;
}
