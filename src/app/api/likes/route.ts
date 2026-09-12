import { auth, db, admin } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import formatTimestamp from "@/hooks/formatTimeStamp";

class LikeError extends Error { constructor(message: string, public status: number) { super(message); } }
async function identity(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new LikeError("Sign in to access likes.", 401);
  try { return (await auth.verifyIdToken(header.slice(7), true)).uid; }
  catch { throw new LikeError("Sign in to access likes.", 401); }
}
const json = (value: unknown) => Response.json(value, { headers: { "Cache-Control": "private, no-store" } });
function failure(error: unknown) {
  if (error instanceof LikeError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Likes request failed", error);
  return Response.json({ error: "Unable to load or update likes. Please retry." }, { status: 500 });
}
function validId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new LikeError("Invalid ranking ID.", 400);
}
const likeRef = (rankingId: string, uid: string) => db.collection("ranking-likes").doc(Buffer.from(JSON.stringify([rankingId, uid])).toString("base64url"));

export async function GET(req: Request) {
  try {
    const uid = await identity(req);
    const url = new URL(req.url);
    const rankingId = url.searchParams.get("rankingId");
    if (!rankingId) {
      const likes = await db.collection("ranking-likes").where("uid", "==", uid).get();
      const rankings = await Promise.all(likes.docs.map(async like => {
        const doc = await db.collection("rankings-meta").doc(like.data().rankingId).get();
        const data = doc.data();
        if (!data || (data.rankObj?.visibility === "PRIVATE" && data.author?.uid !== uid)) return null;
        return { id: doc.id, rankingId: data.rankingId ?? doc.id, author: data.author, rankObj: data.rankObj, likeCount: data.likeCount ?? 0, createdAt: formatTimestamp(data.createdAt), updatedAt: formatTimestamp(data.updatedAt) };
      }));
      return json({ rankings: rankings.filter(Boolean) });
    }
    validId(rankingId);
    const meta = await db.collection("rankings-meta").doc(rankingId).get();
    if (!meta.exists) throw new LikeError("Ranking not found.", 404);
    const data = meta.data()!;
    if (data.rankObj?.visibility === "PRIVATE" && data.author?.uid !== uid) throw new LikeError("This ranking is private.", 403);
    const liked = (await likeRef(rankingId, uid).get()).exists;
    if (url.searchParams.get("users") !== "true") return json({ liked, count: data.likeCount ?? 0 });
    const likes = await db.collection("ranking-likes").where("rankingId", "==", rankingId).get();
    const users = await Promise.all(likes.docs.map(async like => {
      const user = await db.collection("users").doc(like.data().uid).get();
      const profile = user.data();
      return profile ? { uid: user.id, username: profile.username, displayName: profile.displayName, pfp: profile.pfp ?? "" } : null;
    }));
    return json({ liked, count: data.likeCount ?? 0, users: users.filter(Boolean) });
  } catch (error) { return failure(error); }
}

export async function PUT(req: Request) {
  try {
    const uid = await identity(req);
    let body;
    try { body = await req.json(); } catch { throw new LikeError("Invalid JSON.", 400); }
    validId(body?.rankingId);
    if (typeof body.liked !== "boolean") throw new LikeError("Specify whether to like this ranking.", 400);
    const { rankingId, liked } = body;
    const result = await db.runTransaction(async transaction => {
      const ref = db.collection("rankings-meta").doc(rankingId);
      const record = likeRef(rankingId, uid);
      const [meta, existing] = await Promise.all([transaction.get(ref), transaction.get(record)]);
      if (!meta.exists) throw new LikeError("Ranking not found.", 404);
      const data = meta.data()!;
      if (data.author?.uid === uid) throw new LikeError("You cannot like your own ranking.", 403);
      if (liked && data.rankObj?.visibility === "PRIVATE") throw new LikeError("This ranking is private.", 403);
      let count = Math.max(0, Number(data.likeCount) || 0);
      if (liked !== existing.exists) {
        count = Math.max(0, count + (liked ? 1 : -1));
        if (liked) transaction.set(record, { uid, rankingId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        else transaction.delete(record);
        transaction.update(ref, { likeCount: count });
      }
      return { liked, count };
    });
    revalidatePath("/rankings");
    revalidatePath(`/rankings/${rankingId}`);
    revalidatePath("/user/[slug]", "page");
    return json(result);
  } catch (error) { return failure(error); }
}
