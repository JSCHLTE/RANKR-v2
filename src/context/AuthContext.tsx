"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  hasProfile: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  hasProfile: false,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);

      if(user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const profileExists = userDoc.exists();
        setHasProfile(profileExists);

        if(pathname === "/set-username" && profileExists) {
          router.push("/")
        }

        if(pathname === "/signup" && profileExists) {
          router.push("/")
        }

        if(pathname === "/login" && profileExists) {
          router.push("/")
        }

        if(!profileExists && pathname !== "/set-username") {
          router.push("/set-username")
        }

      } else if(!user && pathname === "/set-username") {
        router.push("/signup")
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, hasProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}