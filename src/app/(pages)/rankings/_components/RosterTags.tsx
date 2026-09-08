import { RankFormat } from "@/types/rank";
import { getPositionColors } from "@/constants/positions";

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "SFLEX", "K", "DEF", "DST"];

export default function RosterTags({ format }: { format: RankFormat | null }) {
  const entries = Object.entries(format ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0)
    .sort(([a], [b]) => {
      const order = (position: string) => {
        const index = POSITION_ORDER.indexOf(position);
        return index < 0 ? POSITION_ORDER.length : index;
      };
      return order(a) - order(b);
    });

  if (!entries.length) return null;

  return <div className="space-y-2">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Roster</p>
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([position, count]) => {
        const colors = getPositionColors(position);
        return <span key={position} className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] leading-none ${colors.bg} ${colors.border}`}>
          <span className={`font-semibold ${colors.text}`}>{position}</span>
          <span className="font-semibold tabular-nums text-[var(--foreground)]">{count}</span>
        </span>;
      })}
    </div>
  </div>;
}
