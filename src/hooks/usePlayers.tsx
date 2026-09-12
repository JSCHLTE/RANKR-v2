import { useEffect, useState } from "react";

import { PlayerLite } from "@/types/player";
import { normalizePlayers } from "@/lib/normalize-players";

export function usePlayers() {
  const [players, setPlayers] = useState<Record<string, PlayerLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/players", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`Failed to load players: ${res.status}`);
        }

        const data = await res.json();
        setPlayers(normalizePlayers(data));
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load players"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, []);

  return { players, loading, error };
}

