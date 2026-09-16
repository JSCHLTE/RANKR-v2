import { rankingLimit } from "@/lib/ranking-limit";
import { db, auth, admin } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";
import { readTemplate } from "@/lib/template-files";
import { revalidatePath } from "next/cache";


export async function POST(req: NextRequest) {
  let body;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  let decodedToken;

  try {
    decodedToken = await auth.verifyIdToken(token, true);
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rankObj = body?.rankObj;

  if (!rankObj) {
    return Response.json({ error: "Missing rankObj" }, { status: 400 });
  }

  const authorUid = decodedToken.uid;

  const rankingRef = db.collection("rankings-meta").doc();
  const rankingId = rankingRef.id;

  if (typeof rankObj.name !== "string" || !rankObj.name.trim() || rankObj.name.length > 200 ||
      !["PUBLIC", "PRIVATE"].includes(rankObj.visibility)) {
    return Response.json({ error: "A ranking name (up to 200 characters) and valid visibility are required." }, { status: 400 });
  }
  if (rankObj.description !== undefined && (typeof rankObj.description !== "string" || rankObj.description.length > 5000)) {
    return Response.json({ error: "Description must be text with at most 5000 characters." }, { status: 400 });
  }

  try {

    const { ranks: playerRanksData } = await readTemplate();
    await db.runTransaction(async transaction => {
    const profileRef = db.collection("users").doc(authorUid);
    const profileSnap = await transaction.get(profileRef);
    const profile = profileSnap.data();
    if (!profile) throw new CreationError("User profile not found", 404);
    const existing = await transaction.get(db.collection("rankings-meta").where("author.uid", "==", authorUid).select());
    const limit = rankingLimit(profile.rankrPass);
    if (existing.size >= limit) throw new CreationError(
      limit === 2 ? "You’ve reached your 2-ranking limit. Get RANKR Pass for up to 20 rankings, or delete a ranking to free a slot." : "You’ve reached your 20-ranking limit. Delete a ranking to free a slot.",
      403, { code: "RANKING_LIMIT_REACHED", count: existing.size, limit });

    transaction.set(rankingRef, {
      rankingId,
      author: {
        uid: authorUid,
        username: profile.username,
        displayName: profile.displayName,
        pfp: profile.pfp,
      },
      rankObj: { ...rankObj, name: rankObj.name.trim() },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    transaction.set(db.collection("rankings-ranks").doc(rankingId), {
      ranks: playerRanksData,
    });
    
    // A shared profile write serializes simultaneous creates, even with an empty query.
    transaction.update(profileRef, { lastRankingCreatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    revalidatePath("/rankings");

    return Response.json({ rankingId }, { status: 201 });
  } catch (e) {
      if (e instanceof CreationError) return Response.json({ error: e.message, ...e.details }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

class CreationError extends Error {
  constructor(message: string, public status: number, public details: Record<string, unknown> = {}) { super(message); }
}

export async function GET(req: NextRequest) {
  const header = req.headers.get("authorization");
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });
  if (!header?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  let uid: string;
  try { uid = (await auth.verifyIdToken(header.slice(7), true)).uid; }
  catch { return json({ error: "Unauthorized" }, 401); }
  try {
    const profile = await db.collection("users").doc(uid).get();
    if (!profile.exists) return json({ error: "User profile not found" }, 404);
    const existing = await db.collection("rankings-meta").where("author.uid", "==", uid).count().get();
    return json({ count: existing.data().count, limit: rankingLimit(profile.data()?.rankrPass) });
  } catch { return json({ error: "Unable to check ranking limit." }, 500); }
}
