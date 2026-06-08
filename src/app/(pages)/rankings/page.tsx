import { db } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import RankingFeed from "./_components/RankingFeed";

export const revalidate = 60;

function formatTimestamp(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const Rankings = async () => {
  let loading = true;
  const snapshot = await db.collection("rankings-meta").get();

  const data = snapshot.docs.map((doc) => {
    const raw = doc.data();

    return {
      id: doc.id,
      rankingId: raw.rankingId ?? doc.id,
      author: raw.author ?? null,
      rankObj: raw.rankObj ?? null,
      createdAt: formatTimestamp(raw.createdAt),
      updatedAt: formatTimestamp(raw.updatedAt),
    };
  });

  loading = false;

  return <RankingFeed rankings={data} loading={loading} />;
};

export default Rankings;