"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  hasProfile: boolean | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  hasProfile: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

interface UserProfile {
  username: string,
  displayName: string,
  pfp: string,
  isPaid: boolean;
}



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setProfile(null);
      setHasProfile(null);

      if(user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const profileExists = userDoc.exists();
        setHasProfile(profileExists);
        if (profileExists) setProfile(userDoc.data() as UserProfile);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [])

  const refreshProfile = async (currentUser: User) => {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const profileExists = userDoc.exists();
    setHasProfile(profileExists);
    if (profileExists) setProfile(userDoc.data() as UserProfile);
  };

// Effect 2 - runs on pathname change, handles redirects
useEffect(() => {
  if (loading) return;
  if (user && profile === null && hasProfile === null) return;

  if (user && hasProfile) {
    if (pathname === "/set-username" || pathname === "/signup" || pathname === "/login") {
      router.push("/");
    }
  }

  if (user && hasProfile === false && pathname !== "/set-username") {
    router.push("/set-username");
  }

  if (!user && pathname === "/set-username") {
    router.push("/signup");
  }
}, [pathname, loading]);

  return (
    <AuthContext.Provider value={{ user, loading, hasProfile, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}