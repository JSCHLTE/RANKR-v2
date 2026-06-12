import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import RankingHeader from "./RankingHeader";
import formatTimestamp from "@/hooks/formatTimeStamp";

export default async function RankingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [metaDoc, ranksDoc] = await Promise.all([
    db.collection("rankings-meta").doc(slug).get(),
    db.collection("rankings-ranks").doc(slug).get(),
  ]);

  if (!metaDoc.exists || !ranksDoc.exists) notFound();

  const meta = {
    id: metaDoc.id,
    ...metaDoc.data(),
    createdAt: formatTimestamp(metaDoc.data()?.createdAt),
    updatedAt: formatTimestamp(metaDoc.data()?.updatedAt),
  };
  const ranks = ranksDoc.data();

  return (
    <main className="max-w-5xl mx-auto px-4">
      <RankingHeader meta={meta} />
      {/* rankings list goes here */}
    </main>
  );
}