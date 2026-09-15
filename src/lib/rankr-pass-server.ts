import { db } from "@/lib/firebase-admin";
import { serializeRankrPass } from "./rankr-pass";

/** Resolve current entitlements once per distinct author, never from ranking snapshots. */
export async function withRankrPass<T extends { author: { uid: string } }>(rankings: T[]): Promise<T[]> {
  const uids = [...new Set(rankings.map(ranking => ranking.author?.uid).filter(Boolean))];
  const passes = new Map(await Promise.all(uids.map(async uid => {
    const profile = await db.collection("users").doc(uid).get();
    return [uid, serializeRankrPass(profile.data()?.rankrPass)] as const;
  })));
  return rankings.map(ranking => ({ ...ranking, author: { ...ranking.author, rankrPass: passes.get(ranking.author?.uid) ?? { expiresAt: null } } }));
}
