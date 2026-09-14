import "server-only";
import { db } from "@/lib/firebase-admin";
import type { GameOdds, WeekOdds } from "@/types/odds";
import type { StoredGame, StoredProps, StoredWeek } from "./server/store";
import { weekKey } from "./server/snapshot";

export function validWeek(season: string, week: string) {
  return /^20\d{2}$/.test(season) && /^week-([1-9]|1\d|2[0-2])$/.test(week);
}
function readWeek(value: StoredWeek, season: number, week: number): WeekOdds {
  if (value.schemaVersion !== 1 || value.source !== "sportsgameodds" || value.season !== season || value.week !== week || !Array.isArray(value.games) || !value.updatedAt?.toDate) {
    throw new Error("Stored odds week is invalid.");
  }
  return { season, week, updatedAt: value.updatedAt.toDate().toISOString(), isMock: false, games: value.games };
}
export async function loadWeekOdds(season: string, week: string): Promise<WeekOdds | null> {
  if (!validWeek(season, week)) return null;
  const number = Number(week.slice(5));
  const snapshot = await db.collection("odds-weeks").doc(weekKey(Number(season), number)).get();
  return snapshot.exists ? readWeek(snapshot.data() as StoredWeek, Number(season), number) : null;
}
export async function loadGameOdds(season: string, week: string, slug: string): Promise<GameOdds | null> {
  if (!validWeek(season, week) || !/^[a-z]{2,3}-[a-z]{2,3}$/.test(slug)) return null;
  const number = Number(week.slice(5));
  // A consistent read timestamp prevents mixing headers and props across syncs.
  return db.runTransaction(async transaction => {
    const weekDoc = await transaction.get(db.collection("odds-weeks").doc(weekKey(Number(season), number)));
    if (!weekDoc.exists) return null;
    const storedWeek = weekDoc.data() as StoredWeek;
    const summary = readWeek(storedWeek, Number(season), number).games.find(game => game.slug === slug);
    if (!summary) return null;
    const ref = db.collection("odds-games").doc(summary.eventId);
    const gameDoc = await transaction.get(ref);
    if (!gameDoc.exists) throw new Error("Stored odds game is missing.");
    const game = gameDoc.data() as StoredGame;
    if (game.snapshotId !== storedWeek.snapshotId || game.season !== Number(season) || game.week !== number || game.slug !== slug || game.schemaVersion !== 1) {
      throw new Error("Stored odds game is inconsistent.");
    }
    const propDocs = await transaction.get(ref.collection("props"));
    const playerProps = propDocs.docs.flatMap(doc => {
      const chunk = doc.data() as StoredProps;
      if (chunk.snapshotId !== storedWeek.snapshotId || !Array.isArray(chunk.props)) throw new Error("Stored player props are inconsistent.");
      return chunk.props;
    });
    return { eventId: game.eventId, season: game.season, week: game.week, slug: game.slug,
      away: game.away, home: game.home, startTime: game.startTime, gameOdds: game.gameOdds,
      updatedAt: game.updatedAt.toDate().toISOString(), isMock: false, playerProps };
  }, { readOnly: true });
}
export async function availableWeeks(season: string): Promise<number[]> {
  if (!/^20\d{2}$/.test(season)) return [];
  const snapshot = await db.collection("odds-weeks").where("season", "==", Number(season)).select("week", "schemaVersion", "source").get();
  return snapshot.docs.flatMap(doc => {
    const value = doc.data();
    return value.schemaVersion === 1 && value.source === "sportsgameodds" && Number.isInteger(value.week) && value.week >= 1 && value.week <= 22 ? [value.week as number] : [];
  }).sort((a, b) => a - b);
}
