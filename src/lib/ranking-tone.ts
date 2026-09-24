import { RankFormat } from "@/types/rank";

export type RankingTone = "green" | "blue" | "pink";

export function rankingTone(format: RankFormat | null): RankingTone {
  if (!format) return "green";
  const qb = format.QB ?? 0;
  const rb = format.RB ?? 0;
  const wr = format.WR ?? 0;
  const te = format.TE ?? 0;
  const flex = format.FLEX ?? 0;
  const sflex = format.SFLEX ?? 0;

  if (qb === 1 && rb === 2 && wr === 2 && te === 1 && flex === 0 && sflex === 1) return "pink";
  if (qb === 1 && rb === 2 && te === 1 && sflex === 0 &&
    ((wr === 2 && flex === 2) || (wr === 3 && flex === 1))) return "blue";
  return "green";
}
