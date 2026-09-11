import { useEffect, useState } from "react";

import { PlayerLite } from "@/types/player";
import { normalizePlayers } from "@/lib/normalize-players";

async function loadExperience(): Promise<Record<string, number>> {
  try {
    // The older file supplies experience only; it must never decide which players appear.
    const response = await fetch("/data/player_lite.json");
    if (!response.ok) return {};
    const players: PlayerLite[] = await response.json();
    return Object.fromEntries(players.filter(player => typeof player.yearsExp === "number")
      .map(player => [player.id, player.yearsExp as number]));
  } catch {
    return {};
  }
}

export function usePlayers() {
  const [players, setPlayers] = useState<Record<string, PlayerLite>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        setError(null);

        const [res, experience] = await Promise.all([
          fetch("/api/players", { cache: "no-store" }),
          loadExperience(),
        ]);

        if (!res.ok) {
          throw new Error(`Failed to load players: ${res.status}`);
        }

        const data = await res.json();
        setPlayers(normalizePlayers(data, experience));
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
