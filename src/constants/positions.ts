export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "FLEX"
  | "SFLEX"
  | "K"
  | "DEF"
  | "DST"
  | "ROOKIE";

export interface PositionColors {
    bg: string;
    text: string;
    border: string;
    dot: string;
};

export const POSITION_COLORS: Record<Position, PositionColors> = {
    QB:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400"     },
    WR:    { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30",     dot: "bg-sky-400"     },
    RB:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
    TE:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30",  dot: "bg-orange-400"  },
    FLEX:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30",  dot: "bg-violet-400"  },
    SFLEX: { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30",    dot: "bg-pink-400"    },
    K:     { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30",  dot: "bg-yellow-400"  },
    DEF:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400"   },
    DST:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-400"   },
    ROOKIE:{ bg: "bg-[#FF00F7]/10",   text: "text-[#FF00F7]",   border: "border-[#FF00F7]/30",   dot: "bg-[#FF00F7]"   },
};

export const DEFAULT_POSITION_COLORS: PositionColors = {
    bg: "bg-[var(--surface-hover)]",
    text: "text-[var(--foreground)]",
    border: "border-[var(--border)]",
    dot: "bg-[var(--text-muted)]",
  };

  export const getPositionColors = (position: string | number): PositionColors => {
    return position in POSITION_COLORS
      ? POSITION_COLORS[position as Position]
      : DEFAULT_POSITION_COLORS;
  };