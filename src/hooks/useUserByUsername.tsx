"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface User {
    uid: string;
    username: string;
    displayName: string;
    pfp?: string;
}

const useUserByUsername = (username: string[] | undefined | string) => {

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if(!username) return;
        
        const fetchUser = async () => {
            setLoading(true);

            const q = query(
                collection(db, "users"),
                where("username", "==", username)
            );

            const snapshot = await getDocs(q);

            if(!snapshot.empty) {
                setUser(snapshot.docs[0].data() as User);
            } else {
                setUser(null);
            }

            setLoading(false);

        };

        fetchUser();

    }, [username]);

    return { user, loading };
}

export default useUserByUsername