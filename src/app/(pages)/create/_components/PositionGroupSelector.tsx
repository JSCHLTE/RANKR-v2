import { RankObj } from "@/types/rank";

type PositionGroupSelectorProps = {
    positionGroup: string[];
    onlyRookies: boolean;
    updateField: <K extends keyof RankObj>(
      key: K,
      value: RankObj[K]
    ) => void;
  };

  let isCustomPositionGroup = false;

const PositionGroupSelector = ({ 
    positionGroup,
    updateField,
    onlyRookies
}: PositionGroupSelectorProps) => {

  return (
    <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: ["QB", "RB", "WR", "TE", "K", "DEF"], label: "All", description: "Rank every position" },
            { value: ["QB", "RB", "WR", "TE"], label: "Skill", description: `Rank every skill position
              (QB, RB, WR, TE)` },
            { value: ["QB"], label: "QB", description: "Quarterbacks only" },
            { value: ["RB"], label: "RB", description: "Running backs only" },
            { value: ["WR"], label: "WR", description: "Wide receivers only" },
            { value: ["TE"], label: "TE", description: "Tight ends only" },
            { value: ["K"], label: "Kickers", description: "Kickers only" },
            { value: ["DEF"], label: "Team Defenses", description: "Team defenses only", disabled: onlyRookies },
            { value: ["Custom"], label: "Custom", description: "Choose your own position groups" },
          ].map((option) => (
            <button
              key={option.label}
              disabled={option.disabled}
              onClick={() => {
                if(option.value.includes("Custom")) {
                  isCustomPositionGroup = true;
                  updateField("positionGroup", []);
                  return;
                } else {
                  isCustomPositionGroup = false;
                  updateField("positionGroup", option.value);

                }
              }}
              className={`text-left p-4 rounded-xl border transition-all ${
                option.disabled
                  ? "border-[var(--border)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                  : isCustomPositionGroup && option.value.includes("Custom") || !isCustomPositionGroup && positionGroup.length === option.value.length && positionGroup.every((item, index) => item === option.value[index])
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 cursor-default"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1" style={{ whiteSpace: 'pre-line' }}>
  {option.description}
</p>   
            </button>
          ))}
        </div>

        {/* Custom position picker */}
        {isCustomPositionGroup && (
          <div className="mt-3">
            <p className="text-xs text-[var(--text-muted)] mb-2">Select one or more positions</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "QB", label: "QB" },
                { value: "RB", label: "RB" },
                { value: "WR", label: "WR" },
                { value: "TE", label: "TE" },
                { value: "K", label: "K" },
                { value: "DEF", label: "DEF", disabled: onlyRookies },
              ].map((pos) => (
                <button
                  key={pos.value}
                  disabled={pos.disabled}
                  onClick={() => {
                    if(!positionGroup.includes(pos.value)) {
                      updateField("positionGroup", [...positionGroup, pos.value])
                    } else {
                      updateField("positionGroup", positionGroup.filter(item => item !== pos.value))
                    }
                  }}
                  className={`w-[65px] h-[65px] rounded-xl border font-semibold text-sm transition-all ${
                    pos.disabled
                      ? "border-[var(--border)] bg-[var(--surface)] opacity-40 cursor-not-allowed"
                      : positionGroup.includes(pos.value)
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