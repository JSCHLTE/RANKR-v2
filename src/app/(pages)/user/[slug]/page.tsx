"use client";

import useUserByUsername from "@/hooks/useUserByUsername";
import ProfilePicture from "@/components/profile/ProfilePicture";
import { useParams } from "next/navigation";
import { PageNotFound } from "@/components/pageNotFound/PageNotFound";

const User = () => {

    const pathname = useParams();
    const { user, loading } = useUserByUsername(pathname.slug);

    if(!user && !loading) return <PageNotFound />

  return (
<main className="max-w-5xl mx-auto px-4 py-10">
  <div className="flex flex-col sm:flex-row items-center gap-6 pb-8">
    
    {/* Profile Image */}
    <ProfilePicture 
        src={user?.pfp}
        className="w-32 h-32 sm:w-40 sm:h-40"
    />

    {/* Profile Info */}
    <div className="flex flex-col justify-center h-full text-center sm:text-left">
      <h1 className="text-3xl font-bold tracking-tight">
        {user?.displayName}
      </h1>

      <p className="text-zinc-500 text-lg">
        @{user?.username}
      </p>
    </div>

  </div>
</main>
  )
}

export default User