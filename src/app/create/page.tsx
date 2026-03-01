"use client";

import { useState } from "react";
import PositionGroupSelector from "./_components/PositionGroupSelector";
import CustomFormatSection from "./_components/CustomFormatSection";

const Required = () => (
  <span className="text-[var(--accent)] ml-0.5">*</span>
);

const Optional = () => (
  <span className="text-[var(--text-muted)] font-normal"> — optional</span>
);

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

  // Required: name, positionGroup, mode, visibility
  const canSubmit =
    name.trim() !== "" &&
    (positionGroup !== "" || customPositions.length > 0) &&
    mode !== "" &&
    visibility !== "";

  // Toggle helper for single-select card groups
  const toggle = (current: string, value: string, setter: (v: string) => void) => {
    setter(current === value ? "" : value);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Create a Ranking</h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        This isn&apos;t a league — it&apos;s a player ranking. Some fields below (like scoring, format, and league type) appear on your ranking&apos;s thumbnail so others can instantly see what context it&apos;s built for.
      </p>

      {/* Ranking Name — REQUIRED */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Ranking Name<Required />
        </label>
        <input
          type="text"
          placeholder="e.g. My Week 10 PPR Rankings"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
        />
      </section>

      {/* Allow Rookies — OPTIONAL */}
      <section className="mb-8">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div>
            <p className="font-semibold">
              Rookies Only<span className="text-[var(--text-muted)] font-normal text-sm"> — optional</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Only include rookie players in your rankings
            </p>
          </div>
          <button
            onClick={() => {
              const next = !allowRookies;
              setAllowRookies(next);
              if (next) {
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
                allowRookies ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Position Group — REQUIRED */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Position Group<Required />
        </label>
        <PositionGroupSelector
          toggleCustomPosition={toggleCustomPosition}
          customPositions={customPositions}
          setCustomPositions={setCustomPositions}
          setPositionGroup={setPositionGroup}
          positionGroup={positionGroup}
          allowRookies={allowRookies}
        />
        <p className="mt-2 text-xs text-[var(--text-muted)] flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
          </svg>
          This determines which players appear in your ranking. You won&apos;t be able to change it after creation.
        </p>
      </section>

      {/* Scoring — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Scoring<Optional />
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: "PPR",      label: "PPR",      description: "1 point per reception" },
            { value: "HALF_PPR", label: "Half PPR", description: "0.5 points per reception" },
            { value: "NO_PPR",   label: "No PPR",   description: "Receptions don't score points" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => toggle(scoring, option.value, setScoring)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                scoring === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Format — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Format<Optional />
        </label>
        <CustomFormatSection format={format} setFormat={setFormat} />
      </section>

      {/* League Type — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          League Type<Optional />
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { value: "REDRAFT", label: "Redraft", description: "Rosters clear each season, and all players are redrafted." },
            { value: "KEEPER",  label: "Keeper",  description: "Carry players into next season with customizable keepers." },
            { value: "DYNASTY", label: "Dynasty", description: "Keep your roster each year. Add rookies and free agents." },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => toggle(leagueType, option.value, setLeagueType)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                leagueType === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* League Size — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          League Size<Optional />
        </label>
        <div className="flex flex-wrap gap-2">
          {["4","6","8","10","12","14","16","18","20","22","24","32"].map((size) => (
            <button
              key={size}
              onClick={() => toggle(leagueSize, size, setLeagueSize)}
              className={`w-[65px] h-[65px] rounded-xl border font-semibold transition-all cursor-pointer ${
                leagueSize === size
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {/* Rank Type — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Rank Type<Optional />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "SEASON", label: "Season", description: "Overall rankings for the full season" },
            { value: "WEEKLY", label: "Weekly", description: "Rankings for a specific upcoming week" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => toggle(rankType, option.value, setRankType)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                rankType === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Mode — REQUIRED */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Mode<Required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "LIST", label: "List", description: "Drag players into a ranked order" },
            { value: "TIER", label: "Tier", description: "Sort players into S through F tiers", paid: true },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => toggle(mode, option.value, setMode)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                mode === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
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

      {/* Description — OPTIONAL */}
      <section className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Description<Optional />
        </label>
        <textarea
          placeholder="e.g. Post-week 10 update targeting handcuffs..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] resize-none"
        />
      </section>

      {/* Visibility — REQUIRED */}
      <section className="mb-10">
        <label className="block text-sm font-medium mb-2">
          Visibility<Required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "PUBLIC",  label: "Public",  description: "Anyone can discover and view this ranking" },
            { value: "PRIVATE", label: "Private", description: "Only visible to you" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => toggle(visibility, option.value, setVisibility)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                visibility === option.value
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
              }`}
            >
              <p className="font-semibold">{option.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Submit */}
      <button
        disabled={!canSubmit}
        className={`w-full py-3 rounded-xl font-semibold text-lg transition-all ${
          canSubmit
            ? "bg-[var(--accent)] text-[var(--background)] hover:opacity-90 cursor-pointer"
            : "bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
        }`}
      >
        Create Ranking
      </button>
    </main>
  );
}