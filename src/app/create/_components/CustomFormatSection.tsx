"use client";

import { useState } from "react";

const POSITION_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  QB:    { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-500" },
  WR:    { bg: "bg-sky-500/10",     text: "text-sky-400",     border: "border-sky-500/30",     dot: "bg-sky-500" },
  RB:    { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  TE:    { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30",  dot: "bg-orange-500" },
  FLEX:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30",  dot: "bg-violet-500" },
  SFLEX: { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30",    dot: "bg-pink-500" },
  K:     { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30",  dot: "bg-yellow-500" },
  DEF:   { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30",   dot: "bg-slate-500" },
};

const POSITIONS = ["QB", "WR", "RB", "TE", "FLEX", "SFLEX", "K", "DEF"];

const DEFAULTS: Record<string, number> = {
  QB: 1, WR: 2, RB: 2, TE: 1, FLEX: 1, SFLEX: 0, K: 1, DEF: 1,
};

function PositionCounter({
  pos,
  value,
  onChange,
}: {
  pos: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const colors = POSITION_COLORS[pos];
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-16">
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className="text-sm font-semibold text-[var(--text-muted)]">{pos}</span>
      </div>
      <div
        className={`flex items-center rounded-full border ${colors.border} ${colors.bg} overflow-hidden h-8`}
        style={{ minWidth: "108px" }}
      >
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className={`w-8 h-8 flex items-center justify-center text-base font-bold transition-opacity ${
            value === 0 ? "opacity-25 cursor-not-allowed" : "opacity-70 hover:opacity-100 cursor-pointer"
          } ${colors.text}`}
        >
          −
        </button>
        <span className={`flex-1 text-center text-sm font-bold tabular-nums select-none ${colors.text}`} style={{ minWidth: "28px" }}>
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(50, value + 1))}
          disabled={value === 50}
          className={`w-8 h-8 flex items-center justify-center text-base font-bold transition-opacity ${
            value === 50 ? "opacity-25 cursor-not-allowed" : "opacity-70 hover:opacity-100 cursor-pointer"
          } ${colors.text}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

type CustomFormatSectionProps = {
  format: string;
  setFormat: (value: string) => void;
};

const CustomFormatSection = ({ format, setFormat }: CustomFormatSectionProps) => {
  const [roster, setRoster] = useState<Record<string, number>>({ ...DEFAULTS });

  const updateRoster = (pos: string, val: number) =>
    setRoster((prev) => ({ ...prev, [pos]: val }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { value: "STANDARD",  label: "Standard",  description: "Classic single QB league" },
          { value: "SUPERFLEX", label: "Superflex", description: "Start a QB, WR, RB, or TE in the flex spot" },
          { value: "CUSTOM",    label: "Custom",    description: "Define your own roster settings" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFormat(option.value)}
            className={`text-left p-4 rounded-xl border transition-all ${
              format === option.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
            }`}
          >
            <p className="font-semibold">{option.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
          </button>
        ))}
      </div>

      {format === "CUSTOM" && (
        <div className="mt-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-sm font-semibold mb-4 text-[var(--text-muted)] uppercase tracking-wide">
            Roster Spots
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {POSITIONS.map((pos) => (
              <PositionCounter
                key={pos}
                pos={pos}
                value={roster[pos]}
                onChange={(val) => updateRoster(pos, val)}
              />
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2">
            {POSITIONS.filter((p) => roster[p] > 0).map((pos) => {
              const colors = POSITION_COLORS[pos];
              return (
                <span key={pos} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                  {roster[pos]}× {pos}
                </span>
              );
            })}
            {POSITIONS.every((p) => roster[p] === 0) && (
              <span className="text-xs text-[var(--text-muted)]">No roster spots selected</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFormatSection;