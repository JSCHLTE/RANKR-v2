"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type User } from "firebase/auth";
import { onAuthChange } from "@/lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);

      if(user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if(pathname == "/set-username" && userDoc.exists()) {
          router.push("/")
        }

        if(!userDoc.exists() && pathname !== "/set-username") {
          router.push("/set-username")
        }

      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}