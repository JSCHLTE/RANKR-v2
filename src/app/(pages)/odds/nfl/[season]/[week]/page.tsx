import ProtectedOdds from "@/components/odds/ProtectedOdds";
export const metadata = { title: "NFL Odds | RANKR" };
export default async function WeekPage({ params }: { params: Promise<{ season: string; week: string }> }) {
  return <ProtectedOdds {...await params} />;
}
