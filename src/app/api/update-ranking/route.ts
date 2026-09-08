import { db, auth, admin } from "@/lib/firebase-admin";
import { hasSamePlayers, isRankingUpdate } from "@/lib/ranking-update";
import formatTimestamp from "@/hooks/formatTimeStamp";
import { revalidatePath } from "next/cache";

class UpdateError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function PATCH(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try {
    uid = (await auth.verifyIdToken(authorization.slice(7), true)).uid;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isRankingUpdate(body)) return Response.json({ error: "Invalid ranking fields or player ranks." }, { status: 400 });
  const update = body;

  try {
    const metaRef = db.collection("rankings-meta").doc(update.rankingId);
    const ranksRef = db.collection("rankings-ranks").doc(update.rankingId);
    await db.runTransaction(async transaction => {
      const meta = await transaction.get(metaRef);
      if (!meta.exists) throw new UpdateError("Ranking not found", 404);
      if (meta.data()?.author?.uid !== uid) throw new UpdateError("Only the ranking owner can edit this ranking.", 403);
      const ranks = await transaction.get(ranksRef);
      if (!ranks.exists) throw new UpdateError("Ranking not found", 404);
      if (!Array.isArray(ranks.data()?.ranks) || !hasSamePlayers(ranks.data()!.ranks, update.ranks)) {
        throw new UpdateError("Player ranks must contain exactly the existing players. Reload the ranking and try again.", 400);
      }
      transaction.update(metaRef, {
        "rankObj.name": update.name.trim(),
        "rankObj.description": update.description,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(ranksRef, {
        ranks: update.ranks.map(({ player_id, rank }) => ({ player_id, rank })).sort((a, b) => a.rank - b.rank),
      });
    });
    revalidatePath(`/rankings/${update.rankingId}`);
    revalidatePath("/rankings");
    const saved = await metaRef.get();
    return Response.json({ updatedAt: formatTimestamp(saved.data()?.updatedAt) });
  } catch (error) {
    if (error instanceof UpdateError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Failed to update ranking", error);
    return Response.json({ error: "Unable to save ranking. Please try again." }, { status: 500 });
  }
}
