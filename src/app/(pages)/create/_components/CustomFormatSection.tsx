"use client";

import { useState } from "react";
import { RankObj, RankFormat } from "@/types/rank";
import { getPositionColors } from "@/constants/positions";

type Position = keyof RankFormat;

const POSITIONS: Position[] = ["QB", "WR", "RB", "TE", "FLEX", "SFLEX", "K", "DEF"];

const PRESETS: Record<string, RankFormat> = {
  STANDARD: { QB: 1, WR: 2, RB: 2, TE: 1, FLEX: 1, SFLEX: 0, K: 1, DEF: 1 },
  SUPERFLEX: { QB: 1, WR: 2, RB: 2, TE: 1, FLEX: 0, SFLEX: 1, K: 1, DEF: 1 },
  THREEWR: { QB: 1, WR: 3, RB: 2, TE: 1, FLEX: 1, SFLEX: 0, K: 1, DEF: 1 },
};

function detectPreset(roster: RankFormat): string {
  for (const [key, preset] of Object.entries(PRESETS)) {
    if (POSITIONS.every((p) => roster[p] === preset[p])) {
      return key;
    }
  }
  return "CUSTOM";
}

function PositionCounter({
  pos,
  value,
  onChange,
}: {
  pos: Position;
  value: number;
  onChange: (val: number) => void;
}) {
  const colors = getPositionColors(pos);

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
          className={`w-8 h-8 flex items-center justify-center font-bold transition-opacity ${
            value === 0 ? "opacity-25 cursor-not-allowed" : "opacity-70 hover:opacity-100 cursor-pointer"
          } ${colors.text}`}
        >
          −
        </button>

        <span className={`flex-1 text-center text-sm font-bold tabular-nums ${colors.text}`}>
          {value}
        </span>

        <button
          onClick={() => onChange(Math.min(50, value + 1))}
          disabled={value === 50}
          className={`w-8 h-8 flex items-center justify-center font-bold transition-opacity ${
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
  format: RankFormat | null;
  updateField: <K extends keyof RankObj>(key: K, value: RankObj[K]) => void;
};

const CustomFormatSection = ({ format, updateField }: CustomFormatSectionProps) => {
  const [roster, setRoster] = useState<RankFormat>({ ...PRESETS.STANDARD });

  const detectedFormat = detectPreset(roster);

  const isNone = format === null;

  const isCustomActive = detectedFormat === "CUSTOM" && !isNone;

  const updateRoster = (pos: Position, val: number) => {
    const next = { ...roster, [pos]: val };
    setRoster(next);
    updateField("format", next);
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const next = PRESETS[presetKey];
    setRoster(next);
    updateField("format", next);
  };

  const clearFormat = () => {
    updateField("format", null);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* STANDARD */}
        <button
          onClick={() => {
            if (!isNone && detectedFormat === "STANDARD") {
              clearFormat();
            } else {
              applyPreset("STANDARD");
            }
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            !isNone && detectedFormat === "STANDARD"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
          }`}
        >
          <p className="font-semibold">Standard</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Classic single QB league</p>
        </button>

        {/* SUPERFLEX */}
        <button
          onClick={() => {
            if (!isNone && detectedFormat === "SUPERFLEX") {
              clearFormat();
            } else {
              applyPreset("SUPERFLEX");
            }
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            !isNone && detectedFormat === "SUPERFLEX"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
          }`}
        >
          <p className="font-semibold">Superflex</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Start a QB, WR, RB, or TE in flex
          </p>
        </button>

        {/* THREE WR */}
        <button
          onClick={() => {
            if (!isNone && detectedFormat === "THREEWR") {
              clearFormat();
            } else {
              applyPreset("THREEWR");
            }
          }}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
            !isNone && detectedFormat === "THREEWR"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
          }`}
        >
          <p className="font-semibold">3 WR</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Standard plus extra WR
          </p>
        </button>

        {/* CUSTOM */}
        {detectedFormat === "CUSTOM" && format && (
          <button
            onClick={clearFormat}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
              isCustomActive
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <p className="font-semibold">Custom</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your roster doesn&apos;t match a preset
            </p>
          </button>
        )}
      </div>

      {/* ROSTER */}
      {!isNone && (
        <div className="mt-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <p className="text-sm font-semibold mb-4 text-[var(--text-muted)] uppercase">
            Roster Spots
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {POSITIONS.map((pos) => (
              <PositionCounter
                key={pos}
                pos={pos}
                value={roster[pos] ?? 0}
                onChange={(val) => updateRoster(pos, val)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFormatSection;