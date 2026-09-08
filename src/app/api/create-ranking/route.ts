import { db, auth, admin } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const filePath = path.join(process.cwd(), "public", "data", "player_rankings.json");
const playerRanksData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

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
    decodedToken = await auth.verifyIdToken(token);
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

  const profileSnap = await db.collection("users").doc(authorUid).get();
  const profile = profileSnap.data();

  if (!profileSnap.exists || !profile) {
    return Response.json({ error: "User profile not found" }, { status: 404 });
  }

  if (typeof rankObj.name !== "string" || !rankObj.name.trim() || rankObj.name.length > 200 ||
      !["PUBLIC", "PRIVATE"].includes(rankObj.visibility)) {
    return Response.json({ error: "A ranking name (up to 200 characters) and valid visibility are required." }, { status: 400 });
  }
  if (rankObj.description !== undefined && (typeof rankObj.description !== "string" || rankObj.description.length > 5000)) {
    return Response.json({ error: "Description must be text with at most 5000 characters." }, { status: 400 });
  }

  try {

    const batch = db.batch();

    batch.set(rankingRef, {
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
    
    batch.set(db.collection("rankings-ranks").doc(rankingId), {
      ranks: playerRanksData,
    });
    
    await batch.commit();
    revalidatePath("/rankings");

    return Response.json({ rankingId }, { status: 201 });
  } catch (e) {
      console.error(e);
      return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
