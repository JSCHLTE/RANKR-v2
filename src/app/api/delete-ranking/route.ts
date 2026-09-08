import { db, auth } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

class DeleteError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function DELETE(req: Request) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try {
    uid = (await auth.verifyIdToken(authorization.slice(7), true)).uid;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const rankingId = body?.rankingId;
  if (typeof rankingId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(rankingId)) {
    return Response.json({ error: "Invalid ranking ID" }, { status: 400 });
  }

  try {
    const metaRef = db.collection("rankings-meta").doc(rankingId);
    const ranksRef = db.collection("rankings-ranks").doc(rankingId);
    await db.runTransaction(async transaction => {
      const meta = await transaction.get(metaRef);
      if (!meta.exists) throw new DeleteError("Ranking not found", 404);
      if (meta.data()?.author?.uid !== uid) throw new DeleteError("Only the ranking owner can delete this ranking.", 403);
      transaction.delete(ranksRef);
      transaction.delete(metaRef);
    });
    revalidatePath(`/rankings/${rankingId}`);
    revalidatePath("/rankings");
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof DeleteError) return Response.json({ error: error.message }, { status: error.status });
    console.error("Failed to delete ranking", error);
    return Response.json({ error: "Unable to delete ranking. Please try again." }, { status: 500 });
  }
}
