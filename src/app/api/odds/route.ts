import { auth, db } from "@/lib/firebase-admin";
import { hasActiveRankrPass, serializeRankrPass } from "@/lib/rankr-pass";
import { availableWeeks, loadGameOdds, loadWeekOdds, validWeek } from "@/lib/odds/loadOdds";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });

export async function GET(req: Request) {
  const token = req.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) return json({ error: "Sign in to view odds." }, 401);
  let uid: string;
  try { uid = (await auth.verifyIdToken(token.slice(7), true)).uid; }
  catch { return json({ error: "Sign in to view odds." }, 401); }
  const params = new URL(req.url).searchParams;
  const season = params.get("season") ?? "";
  const week = params.get("week") ?? "";
  const game = params.get("game");
  if (!validWeek(season, week) || (game !== null && !/^[a-z]{2,3}-[a-z]{2,3}$/.test(game))) return json({ error: "Invalid odds page." }, 400);
  try {
    const profile = await db.collection("users").doc(uid).get();
    const pass = serializeRankrPass(profile.data()?.rankrPass);
    if (game !== null && !hasActiveRankrPass(pass)) return json({ error: "RANKR Pass required." }, 403);
    // Authorization happens before any odds or player prop reads.
    const weekData = await loadWeekOdds(season, week) ?? { season: Number(season), week: Number(week.slice(5)), updatedAt: "", isMock: false, games: [] };
    if (game !== null) {
      const gameData = await loadGameOdds(season, week, game);
      if (!gameData) return json({ error: "Game not found." }, 404);
      return json({ week: weekData, game: gameData, pass });
    }
    return json({ week: weekData, weeks: await availableWeeks(season), pass });
  } catch {
    return json({ error: "Unable to load odds. Please try again." }, 500);
  }
}
