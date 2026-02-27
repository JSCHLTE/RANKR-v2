"use client";

import { useState } from "react";

export default function CreateRankingPage() {
  const [name, setName] = useState("");
  const [allowRookies, setAllowRookies] = useState(false);
  const [positionGroup, setPositionGroup] = useState("");
  const [customPositions, setCustomPositions] = useState<string[]>([]);
  const [scoring, setScoring] = useState("");
  const [format, setFormat] = useState("");
  const [leagueType, setLeagueType] = useState("");
  const [leagueSize, setLeagueSize] = useState("");
  const [rankType, setRankType] = useState("");
  const [mode, setMode] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("");

  const toggleCustomPosition = (value: string) => {
    setCustomPositions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Create a Ranking</h1>

      {/* Ranking Name */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Ranking Name</label>
        <input
          type="text"
          placeholder="e.g. My Week 10 PPR Rankings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
        />
      </section>

      {/* Allow Rookies */}
      <section className="mb-8">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div>
            <p className="font-semibold">Rookies Only</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Only include rookie players in your rankings
            </p>
          </div>
          <button
            onClick={() => {
              const next = !allowRookies;
              setAllowRookies(next);
              if (next) {
                // Turning rookies ON — clear DEF from custom, deselect Defense
                setCustomPositions((prev) => prev.filter((p) => p !== "DEF"));
                if (positionGroup === "Defense") setPositionGroup("");
              }
            }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
              allowRookies ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                allowRookies ? "translate-x-6 bg-[var(--accent)" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Position Group */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Position Group</label>
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
      </section>

      {/* Scoring */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Scoring</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: "PPR", label: "PPR", description: "1 point per reception" },
            { value: "HALF_PPR", label: "Half PPR", description: "0.5 points per reception" },
            { value: "NO_PPR", label: "No PPR", description: "Receptions don't score points" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setScoring(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                scoring === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Format */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Format</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { value: "STANDARD", label: "Standard", description: "Classic single QB league" },
            { value: "SUPERFLEX", label: "Superflex", description: "Start a QB, WR, RB, or TE in the flex spot" },
            { value: "CUSTOM", label: "Custom", description: "Define your own roster settings" },
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
      </section>

      {/* League Type */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">League Type</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { value: "REDRAFT", label: "Redraft", description: "Rosters clear each season, and all players are redrafted." },
            { value: "KEEPER", label: "Keeper", description: "Carry players into next season with customizable keepers." },
            { value: "DYNASTY", label: "Dynasty", description: "Keep your roster each year. Add rookies and free agents." },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setLeagueType(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                leagueType === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* League Size */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">League Size</label>
        <div className="flex flex-wrap gap-2">
          {["4","6","8","10","12","14","16","18","20","22","24","32"].map((size) => (
            <button
              key={size}
              onClick={() => setLeagueSize(size)}
              className={`w-[65px] h-[65px] rounded-xl border font-semibold transition-all ${
                leagueSize === size
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {/* Rank Type */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Rank Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "SEASON", label: "Season", description: "Overall rankings for the full season" },
            { value: "WEEKLY", label: "Weekly", description: "Rankings for a specific upcoming week" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRankType(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                rankType === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Mode */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Mode</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "LIST", label: "List", description: "Drag players into a ranked order" },
            { value: "TIER", label: "Tier", description: "Sort players into S through F tiers", paid: true },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                mode === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="font-semibold">{option.label}</p>
                {option.paid && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-medium">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Description <span className="text-[var(--text-muted)] font-normal">— optional</span>
        </label>
        <textarea
          placeholder="e.g. Post-week 10 update targeting handcuffs..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] resize-none"
        />
      </section>

      {/* Visibility */}
      <section className="mb-10">
        <label className="block text-sm font-medium mb-2">Visibility</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "PUBLIC", label: "Public", description: "Anyone can discover and view this ranking" },
            { value: "DRAFT", label: "Draft", description: "Only visible to you" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setVisibility(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                visibility === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Submit */}
      <button className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--background)] font-semibold text-lg hover:opacity-90 transition-opacity hover:cursor-pointer">
        Create Ranking
      </button>
    </main>
  );
}