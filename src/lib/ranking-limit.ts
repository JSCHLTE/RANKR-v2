import { hasActiveRankrPass } from "./rankr-pass";

export const FREE_RANKING_LIMIT = 2;
export const PASS_RANKING_LIMIT = 20;

export function rankingLimit(pass: unknown) {
  return hasActiveRankrPass(pass) ? PASS_RANKING_LIMIT : FREE_RANKING_LIMIT;
}
