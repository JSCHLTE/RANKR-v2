import { db } from "@/lib/firebase-admin";
import { hasActiveRankrPass, serializeRankrPass } from "./rankr-pass";
import { oldestEditableIds } from "./ranking-edit-access";

export async function rankingEditAccess(transaction: FirebaseFirestore.Transaction, uid: string, rankingId: string) {
  const profile = await transaction.get(db.collection("users").doc(uid));
  const pass = serializeRankrPass(profile.data()?.rankrPass);
  const rankings = await transaction.get(db.collection("rankings-meta").where("author.uid", "==", uid));
  const oldest = oldestEditableIds(rankings.docs.map(doc => ({
    id: doc.id,
    createdAt: doc.data().createdAt?.toMillis?.() ?? doc.createTime?.toMillis() ?? 0,
  })));
  const isOldest = oldest.includes(rankingId);
  return { canEdit: isOldest || hasActiveRankrPass(pass), isOldest, expiresAt: pass.expiresAt };
}
