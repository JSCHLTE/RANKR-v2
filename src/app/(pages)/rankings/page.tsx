import { withRankrPass } from "@/lib/rankr-pass-server";
import { db } from "@/lib/firebase-admin";
import formatTimestamp from "@/hooks/formatTimeStamp";
import RankingFeed from "./_components/RankingFeed";

export const dynamic = "force-dynamic";

const Rankings = async () => {
  let loading = true;
  const snapshot = await db.collection("rankings-meta").where("rankObj.visibility", "==", "PUBLIC").get();

  const data = snapshot.docs.map((doc) => {
    const raw = doc.data();

    return {
      id: doc.id,
      rankingId: raw.rankingId ?? doc.id,
      author: raw.author ?? null,
      rankObj: raw.rankObj ?? null,
      likeCount: raw.likeCount ?? 0,
      createdAt: formatTimestamp(raw.createdAt),
      createdAtMs: raw.createdAt?.toMillis?.() ?? doc.createTime?.toMillis() ?? 0,
      updatedAt: formatTimestamp(raw.updatedAt),
    };
  });

  loading = false;

  return <RankingFeed rankings={await withRankrPass(data)} loading={loading} />;
};

export default Rankings;
