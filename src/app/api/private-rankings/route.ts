import { auth, db } from "@/lib/firebase-admin";
import formatTimestamp from "@/hooks/formatTimeStamp";

export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });
function serialize(id: string, data: FirebaseFirestore.DocumentData) {
  return { id, rankingId: id, author: data.author, rankObj: data.rankObj, likeCount: data.likeCount ?? 0,
    createdAt: formatTimestamp(data.createdAt), updatedAt: formatTimestamp(data.updatedAt) };
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) return json({ error: "Sign in to view your private rankings." }, 401);
  let uid: string;
  try { uid = (await auth.verifyIdToken(token.slice(7), true)).uid; }
  catch { return json({ error: "Sign in to view your private rankings." }, 401); }
  const id = new URL(req.url).searchParams.get("id");
  if (id !== null && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return json({ error: "Invalid ranking ID." }, 400);
  try {
    if (id !== null) {
      const result = await db.runTransaction(async transaction => {
        const meta = await transaction.get(db.collection("rankings-meta").doc(id));
        const data = meta.data();
        // Do not read or serialize the ranks until ownership has been verified.
        if (!data || data.author?.uid !== uid) return null;
        const ranks = await transaction.get(db.collection("rankings-ranks").doc(id));
        if (!ranks.exists) return null;
        return { meta: serialize(id, data), ranks: ranks.data()?.ranks ?? [], tiers: ranks.data()?.tiers ?? [] };
      }, { readOnly: true });
      return result ? json(result) : json({ error: "Ranking not found or unavailable to this account." }, 404);
    }
    const snapshot = await db.collection("rankings-meta").where("author.uid", "==", uid).get();
    const rankings = snapshot.docs.filter(doc => doc.data().rankObj?.visibility === "PRIVATE")
      .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))
      .map(doc => serialize(doc.id, doc.data()));
    return json({ rankings });
  } catch {
    return json({ error: "Unable to load rankings. Please try again." }, 500);
  }
}
