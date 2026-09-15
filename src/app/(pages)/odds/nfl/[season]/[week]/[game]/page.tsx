import { notFound } from "next/navigation";
import { loadGameOdds, loadWeekOdds } from "@/lib/odds/loadOdds";
import { MatchupHeader } from "@/components/odds/MatchupHeader";
import { SportsbookFilter } from "@/components/odds/OddsPreferences";
import { GameLines } from "@/components/odds/GameLines";
import { PlayerProps } from "@/components/odds/PlayerProps";
import { AdminOddsSync } from "@/components/odds/AdminOddsSync";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ season: string; week: string; game: string }> }) {
  const { season, week, game } = await params;
  const data = await loadGameOdds(season, week, game);
  return { title: data ? `${data.away.abbr} @ ${data.home.abbr} Odds | RANKR` : "Game not found | RANKR" };
}
export default async function GamePage({ params }: { params: Promise<{ season: string; week: string; game: string }> }) {
  const { season, week, game } = await params;
  const [data, weekData] = await Promise.all([loadGameOdds(season, week, game), loadWeekOdds(season, week)]);
  if (!data) notFound();
  const header = { season: data.season, week: data.week, eventId: data.eventId, slug: data.slug, away: data.away, home: data.home, startTime: data.startTime, updatedAt: data.updatedAt, isMock: data.isMock };
  const matchups = (weekData?.games ?? []).map(({ eventId, slug, away, home, startTime }) => ({ eventId, slug, away, home, startTime }));
  return <><MatchupHeader game={header} games={matchups} />
    <AdminOddsSync key={`${season}-${week}`} season={data.season} week={data.week} /><SportsbookFilter /><GameLines books={data.gameOdds} away={data.away.abbr} home={data.home.abbr} /><PlayerProps props={data.playerProps} />
  </>;
}

