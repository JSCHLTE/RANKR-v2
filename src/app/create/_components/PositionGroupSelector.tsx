type PositionGroupSelectorProps = {
    toggleCustomPosition: (value: string) => void;
    customPositions: string[];
    setCustomPositions: (positions: string[]) => void;
    positionGroup: string;
    setPositionGroup: (option: string) => void;
    allowRookies: boolean;
  };

const PositionGroupSelector = ({ 
    toggleCustomPosition,
    customPositions,
    setCustomPositions,
    positionGroup,
    setPositionGroup,
    allowRookies
}: PositionGroupSelectorProps) => {
  return (
    <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: "ALL", label: "All", description: "Rank every offensive skill position" },
            { value: "QB", label: "QB", description: "Quarterbacks only" },
            { value: "RB", label: "RB", description: "Running backs only" },
            { value: "WR", label: "WR", description: "Wide receivers only" },
            { value: "TE", label: "TE", description: "Tight ends only" },
            { value: "K", label: "Kickers", description: "Kickers only" },
            { value: "Defense", label: "Team Defenses", description: "Team defenses only", disabled: allowRookies },
            { value: "Custom", label: "Custom", description: "Choose your own position groups" },
          ].map((option) => (
            <button
              key={option.value}
              disabled={option.disabled}
              onClick={() => {
                setPositionGroup(option.value);
                if (option.value !== "Custom") setCustomPositions([]);
              }}
              className={`text-left p-4 rounded-xl border transition-all ${
                option.disabled
                  ? "border-[var(--border)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                  : positionGroup === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 cursor-default"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Custom position picker */}
        {positionGroup === "Custom" && (
          <div className="mt-3">
            <p className="text-xs text-[var(--text-muted)] mb-2">Select one or more positions</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "QB", label: "QB" },
                { value: "WR", label: "WR" },
                { value: "RB", label: "RB" },
                { value: "TE", label: "TE" },
                { value: "K", label: "K" },
                { value: "DEF", label: "DEF", disabled: allowRookies },
              ].map((pos) => (
                <button
                  key={pos.value}
                  disabled={pos.disabled}
                  onClick={() => toggleCustomPosition(pos.value)}
                  className={`w-[65px] h-[65px] rounded-xl border font-semibold text-sm transition-all ${
                    pos.disabled
                      ? "border-[var(--border)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                      : customPositions.includes(pos.value)
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 cursor-pointer"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] cursor-pointer"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}
    </>
  )
}

export default PositionGroupSelector