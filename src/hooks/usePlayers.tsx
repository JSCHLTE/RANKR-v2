import { useEffect, useState } from "react";

interface Player {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    team: string;
    position: string;
    fantasyPositions: string[];
  }

export function usePlayers() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/data/player_lite.json");

        if (!res.ok) {
          throw new Error(`Failed to load players: ${res.status}`);
        }

        const data: Player[] = await res.json();
        const map = Object.fromEntries(data.map((p) => [p.id, p]));
        setPlayers(map);
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