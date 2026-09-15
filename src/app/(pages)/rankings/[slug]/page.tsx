import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import formatTimestamp from "@/hooks/formatTimeStamp";
import { RankingMeta } from "@/types/rank";
import RankingView from "./RankingView";
import { PrivateRankings } from "@/components/PrivateRankings";

export const dynamic = "force-dynamic";

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!/^[A-Za-z0-9_-]{1,128}$/.test(slug)) notFound();
  const metaDoc = await db.collection("rankings-meta").doc(slug).get();
  if (!metaDoc.exists) notFound();
  const data = metaDoc.data();
  if (data?.rankObj?.visibility !== "PUBLIC") {
    return <main className="max-w-5xl mx-auto px-4 mb-10"><PrivateRankings key={slug} rankingId={slug} /></main>;
  }
  const ranksDoc = await db.collection("rankings-ranks").doc(slug).get();
  if (!ranksDoc.exists) notFound();

  const meta: RankingMeta = {
    id: metaDoc.id,
    rankingId: data?.rankingId,
    author: data?.author,
    rankObj: data?.rankObj,
    likeCount: data?.likeCount ?? 0,
    createdAt: formatTimestamp(data?.createdAt),
    updatedAt: formatTimestamp(data?.updatedAt),
  };
  
  const ranks = ranksDoc.data();

  return (
    <main className="max-w-5xl mx-auto px-4 mb-10">
        <RankingView key={slug} meta={meta} ranks={ranks?.ranks ?? []} tiers={ranks?.tiers ?? []} />
    </main>
  );
}

