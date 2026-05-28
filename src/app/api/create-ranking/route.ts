import { db, auth, admin } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

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

  const rankingRef = db.collection("rankings").doc();
  const rankingId = rankingRef.id;

  try {
    const templateSnap = await db.collection("rankr-template").get();

    if (templateSnap.empty) {
      return Response.json(
        { error: "Ranking template is empty" },
        { status: 500 }
      );
    }

    const playerRanks = templateSnap.docs
      .map((templateDoc) => {
        const templateData = templateDoc.data();

        const playerId = templateData.player_id;
        const rank = templateData.rank;

        if (!playerId || rank == null) return null;

        return {
          player_id: playerId,
          rank,
        };
      })
      .filter(Boolean);

    await rankingRef.set({
      rankingId,
      authorUid,
      rankObj,
      playerRanks,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return Response.json({ rankingId }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}