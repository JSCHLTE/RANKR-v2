import "server-only";
import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData, type DocumentReference } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import type { GameOdds, GameSummary, PlayerProp } from "@/types/odds";
import type { NormalizedGame } from "./normalizeSportsGameOdds";
import { OddsSyncError } from "./errors";
import { headline, splitProps, weekKey } from "./snapshot";

export interface StoredWeek {
  schemaVersion: 1; source: "sportsgameodds"; snapshotId: string;
  season: number; week: number; updatedAt: Timestamp; games: GameSummary[];
}
export interface StoredGame extends Omit<GameOdds, "playerProps" | "updatedAt" | "isMock"> {
  schemaVersion: 1; source: "sportsgameodds"; snapshotId: string; gameId: string;
  weekKey: string; updatedAt: Timestamp; sourceUpdatedAt?: Timestamp;
}
export interface StoredProps { snapshotId: string; category: string; props: PlayerProp[] }

export async function currentRevision(season: number, week: number): Promise<string | null> {
  const snapshot = await db.collection("odds-weeks").doc(weekKey(season, week)).get();
  return snapshot.exists ? snapshot.updateTime!.toDate().toISOString() + ":" + snapshot.updateTime!.nanoseconds : null;
}

export async function publishSnapshot(season: number, week: number, games: NormalizedGame[], expectedRevision: string | null) {
  const key = weekKey(season, week);
  const weekRef = db.collection("odds-weeks").doc(key);
  const snapshotId = randomUUID();
  const updatedAt = FieldValue.serverTimestamp();
  const writes: { ref: DocumentReference; data: DocumentData }[] = [];
  for (const game of games) {
    const { playerProps, updatedAt: ignoredTime, isMock: ignoredMock, sourceUpdatedAt, ...fields } = game;
    void ignoredTime; void ignoredMock;
    const ref = db.collection("odds-games").doc(game.eventId);
    writes.push({ ref, data: { ...fields, gameId: game.eventId, weekKey: key, schemaVersion: 1,
      source: "sportsgameodds", snapshotId, updatedAt,
      ...(sourceUpdatedAt ? { sourceUpdatedAt: Timestamp.fromDate(new Date(sourceUpdatedAt)) } : {}),
    } });
    for (const chunk of splitProps(playerProps)) {
      writes.push({ ref: ref.collection("props").doc(chunk.id), data: { category: chunk.category, props: chunk.props, snapshotId } });
    }
  }
  writes.push({ ref: weekRef, data: { schemaVersion: 1, season, week, source: "sportsgameodds", snapshotId, updatedAt, games: games.map(headline) } });
  for (const write of writes) {
    if (Buffer.byteLength(JSON.stringify(write.data)) > 750000) throw new OddsSyncError("Odds document exceeds the storage safety limit; nothing was updated.", 422);
  }
  const newPaths = new Set(writes.map(write => write.ref.path));
  // One atomic transaction replaces the selected week. Guardrails fail closed
  // instead of publishing a partially completed series of batches.
  await db.runTransaction(async transaction => {
    const prior = await transaction.get(weekRef);
    const revision = prior.exists ? prior.updateTime!.toDate().toISOString() + ":" + prior.updateTime!.nanoseconds : null;
    if (revision !== expectedRevision) throw new OddsSyncError("This week was updated by another sync. Refresh and try again.", 409);
    const oldGames = await transaction.get(db.collection("odds-games").where("weekKey", "==", key));
    const refs = new Map(oldGames.docs.map(doc => [doc.id, doc.ref]));
    for (const game of games) refs.set(game.eventId, db.collection("odds-games").doc(game.eventId));
    const oldDocuments: { ref: DocumentReference; data: DocumentData }[] = [];
    // All reads precede writes. Refuse to overwrite a stable ID from another week.
    for (const ref of refs.values()) {
      const doc = await transaction.get(ref);
      if (doc.exists) {
        const data = doc.data()!;
        if (data.weekKey !== key) throw new OddsSyncError("An event belongs to another stored week; nothing was updated.", 409);
        oldDocuments.push({ ref, data });
      }
      const props = await transaction.get(ref.collection("props"));
      for (const prop of props.docs) oldDocuments.push({ ref: prop.ref, data: prop.data() });
    }
    const deletes = oldDocuments.filter(doc => !newPaths.has(doc.ref.path));
    const bytes = [...writes, ...oldDocuments].reduce((sum, doc) => sum + Buffer.byteLength(JSON.stringify(doc.data)), 0);
    if (writes.length + deletes.length > 400 || bytes > 6000000) throw new OddsSyncError("Week snapshot exceeds the atomic sync safety limit; nothing was updated.", 422);
    for (const doc of deletes) transaction.delete(doc.ref);
    for (const doc of writes) transaction.set(doc.ref, doc.data); // Deliberately no merge.
  });
  const saved = await weekRef.get();
  return (saved.data() as StoredWeek).updatedAt.toDate().toISOString();
}
