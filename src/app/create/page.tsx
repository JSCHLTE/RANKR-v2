"use client";

import { useState } from "react";

export default function CreateRankingPage() {
  const [name, setName] = useState("");
  const [positionGroup, setPositionGroup] = useState("");
  const [scoring, setScoring] = useState("");
  const [format, setFormat] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("");

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Create a Ranking</h1>

      {/* Ranking Name */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Ranking Name</label>
        <input
          type="text"
          placeholder="e.g. My Week 10 PPR Rankings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 focus:outline-none focus:border-[var(--accent)]"
        />
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
            { value: "Rookies", label: "Rookies", description: "Rookies only" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPositionGroup(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                positionGroup === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 cursor-default"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
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
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Format */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Format</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "STANDARD", label: "Standard", description: "Classic single QB league" },
            { value: "SUPERFLEX", label: "Superflex", description: "Start a QB, WR, RB, or TE in the flex spot" },
            { value: "DYNASTY", label: "Dynasty", description: "Keep players on your roster year to year" },
            { value: "CUSTOM", label: "Custom", description: "Define your own roster settings" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormat(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                format === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Type */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "SEASON", label: "Season", description: "Overall rankings for the full season" },
            { value: "WEEKLY", label: "Weekly", description: "Rankings for a specific upcoming week", paid: true },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                type === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
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
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
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
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
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
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Description <span className="text-white/30 font-normal">— optional</span>
        </label>
        <textarea
          placeholder="e.g. Post-week 10 update targeting handcuffs..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 focus:outline-none focus:border-[var(--accent)] resize-none"
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
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:cursor-pointer"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-white/50 mt-1">{option.description}</p>
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