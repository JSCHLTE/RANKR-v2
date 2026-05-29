import { db, auth, admin } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

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

  const rankObj = body.rankObj;

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

  if (!rankObj.name || !rankObj.positionGroup || !rankObj.mode || !rankObj.visibility) {
    return Response.json({ error: "Missing required ranking fields" }, { status: 400 });
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
      rankObj,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    batch.set(db.collection("rankings-ranks").doc(rankingId), {
      ranks: playerRanksData,
    });
    
    await batch.commit();

    return Response.json({ rankingId }, { status: 201 });
  } catch (e) {
      console.error(e);
      return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}