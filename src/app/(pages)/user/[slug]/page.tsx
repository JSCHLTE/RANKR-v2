import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import ProfilePicture from "@/components/profile/ProfilePicture";
import { RankingCard } from "../../rankings/_components/RankingCard";
import formatTimestamp from "@/hooks/formatTimeStamp";
import { RankingMeta } from "@/types/rank";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const snapshot = await db
    .collection("users")
    .where("username", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) notFound();

  const user = snapshot.docs[0].data();
  const rankingsSnapshot = await db.collection("rankings-meta")
    .where("author.uid", "==", snapshot.docs[0].id)
    .get();
  const rankings: RankingMeta[] = rankingsSnapshot.docs
    .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        rankingId: data.rankingId ?? doc.id,
        author: data.author,
        rankObj: data.rankObj,
        likeCount: data.likeCount ?? 0,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
      };
    });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-8">
        <ProfilePicture
          src={user.pfp}
          className="w-32 h-32 sm:w-40 sm:h-40"
        />
        <div className="flex flex-col justify-center h-full text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight">
            {user.displayName}
          </h1>
          <p className="text-zinc-500 text-lg">@{user.username}</p>
        </div>
      </div>
      <section aria-labelledby="user-rankings-title" className="border-t border-[var(--border)] pt-8">
        <div className="mb-6">
          <h2 id="user-rankings-title" className="text-xl font-semibold tracking-tight">Rankings</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Created by @{user.username}</p>
        </div>
        {rankings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rankings.map(ranking => <RankingCard key={ranking.id} ranking={ranking} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
            <p className="font-medium">No rankings yet</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">This user hasn’t created any rankings yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

