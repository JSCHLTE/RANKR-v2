import ProtectedOdds from "@/components/odds/ProtectedOdds";
export const metadata = { title: "Game Odds & Player Props | RANKR" };
export default async function GamePage({ params }: { params: Promise<{ season: string; week: string; game: string }> }) {
  return <ProtectedOdds {...await params} />;
}
