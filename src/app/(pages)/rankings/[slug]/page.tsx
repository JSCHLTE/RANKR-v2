import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import formatTimestamp from "@/hooks/formatTimeStamp";
import { RankingMeta } from "@/types/rank";
import RankingView from "./RankingView";

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [metaDoc, ranksDoc] = await Promise.all([
    db.collection("rankings-meta").doc(slug).get(),
    db.collection("rankings-ranks").doc(slug).get(),
  ]);

  if (!metaDoc.exists || !ranksDoc.exists) notFound();

  const data = metaDoc.data();

  const meta: RankingMeta = {
    id: metaDoc.id,
    rankingId: data?.rankingId,
    author: data?.author,
    rankObj: data?.rankObj,
    createdAt: formatTimestamp(data?.createdAt),
    updatedAt: formatTimestamp(data?.updatedAt),
  };
  
  const ranks = ranksDoc.data();

  return (
    <main className="max-w-5xl mx-auto px-4 mb-10">
        <RankingView meta={meta} ranks={ranks?.ranks ?? []} />
    </main>
  );
}