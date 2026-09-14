import type { GameSummary, PlayerProp } from "@/types/odds";
import type { NormalizedGame } from "./normalizeSportsGameOdds";
import { OddsSyncError } from "./errors";

export const weekKey = (season: number, week: number) => `${season}-week-${week}`;
export function headline(game: NormalizedGame): GameSummary {
  const { eventId, slug, away, home, startTime, gameOdds } = game;
  return { eventId, slug, away, home, startTime, sportsbooks: gameOdds };
}
export interface PropsChunk { id: string; category: string; props: PlayerProp[] }
// Split categories before they approach Firestore's 1 MiB document ceiling.
export function splitProps(props: PlayerProp[], maxBytes = 180000): PropsChunk[] {
  const categories = new Map<string, PlayerProp[]>();
  for (const prop of props) categories.set(prop.category, [...(categories.get(prop.category) ?? []), prop]);
  const chunks: PropsChunk[] = [];
  for (const [category, items] of categories) {
    let current: PlayerProp[] = [];
    let size = 0;
    let part = 0;
    const flush = () => {
      if (current.length) chunks.push({ id: `${category}-${part++}`, category, props: current });
      current = []; size = 0;
    };
    for (const prop of items) {
      const bytes = Buffer.byteLength(JSON.stringify(prop), "utf8") + 1;
      if (bytes > maxBytes) throw new OddsSyncError("A player prop exceeds the storage safety limit; nothing was updated.", 422);
      if (size + bytes > maxBytes) flush();
      current.push(prop); size += bytes;
    }
    flush();
  }
  return chunks;
}
