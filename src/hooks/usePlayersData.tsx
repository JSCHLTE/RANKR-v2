"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/player";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function usePlayersData() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchPlayers = async () => {
        setLoading(true);
  
        try {
          const ref = collection(db, "fantasy-players");
          const snapshot = await getDocs(ref);
  
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Player[];
  
          setPlayers(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchPlayers();
    }, []);
  
    return { players, loading };
  }