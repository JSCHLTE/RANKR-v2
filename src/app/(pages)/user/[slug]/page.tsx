import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import ProfilePicture from "@/components/profile/ProfilePicture";

export default async function UserPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const snapshot = await db
    .collection("users")
    .where("username", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) notFound();

  const user = snapshot.docs[0].data();

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
    </main>
  );
}