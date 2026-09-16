import { FREE_RANKING_LIMIT } from "./ranking-limit";

interface RankingAge { id: string; createdAt: number }

/** IDs break timestamp ties consistently. Call with every ranking owned by this user. */
export function oldestEditableIds(rankings: RankingAge[]): string[] {
  return [...rankings].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, FREE_RANKING_LIMIT).map(ranking => ranking.id);
}
