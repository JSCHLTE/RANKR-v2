"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { SPORTSBOOK_IDS, SPORTSBOOKS, type Sportsbook } from "@/lib/odds/sportsbooks";
import type { OddsPreferences } from "@/types/odds";
const defaults: OddsPreferences = { mode: "consensus", sportsbook: "draftkings", includedBooks: SPORTSBOOK_IDS };
const Context = createContext<{ preferences: OddsPreferences; update: (value: OddsPreferences) => void }>({ preferences: defaults, update: () => {} });
export const useOddsPreferences = () => useContext(Context);
const isBook = (value: unknown): value is Sportsbook => typeof value === "string" && SPORTSBOOK_IDS.some(book => book === value);
export function OddsPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("rankr-odds-v1") ?? "null");
      if (saved && typeof saved === "object" && "mode" in saved && "sportsbook" in saved && "includedBooks" in saved &&
        (saved.mode === "consensus" || saved.mode === "sportsbook") && isBook(saved.sportsbook) && Array.isArray(saved.includedBooks)) {
        // Restore after hydration so the server and initial client render match.
        const next: OddsPreferences = { mode: saved.mode, sportsbook: saved.sportsbook, includedBooks: SPORTSBOOK_IDS };
        queueMicrotask(() => setPreferences(next));
      }
    } catch { /* Storage may be disabled or contain an older preference format. */ }
  }, []);
  function update(value: OddsPreferences) {
    setPreferences(value);
    try { localStorage.setItem("rankr-odds-v1", JSON.stringify(value)); } catch { /* In-memory filtering still works. */ }
  }
  return <Context.Provider value={{ preferences, update }}>{children}</Context.Provider>;
}
export function SportsbookFilter({ children }: { children?: ReactNode }) {
  const { preferences, update } = useOddsPreferences();
  const dropdown = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dropdown.current?.open) {
        dropdown.current.open = false;
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  function select(book: Sportsbook | "consensus") {
    update({ ...preferences, mode: book === "consensus" ? "consensus" : "sportsbook", sportsbook: book === "consensus" ? preferences.sportsbook : book, includedBooks: SPORTSBOOK_IDS });
    if (dropdown.current) dropdown.current.open = false;
    trigger.current?.focus();
  }
  const selected = preferences.mode === "consensus" ? "consensus" : preferences.sportsbook;
  return <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
    {children}
    <details ref={dropdown} className="group relative text-sm">
      <summary ref={trigger} aria-label={`Odds display: ${selected === "consensus" ? "Consensus" : SPORTSBOOKS[selected].name}`} className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden">
        <span className="text-xs text-[var(--text-muted)]">Odds display</span>
        {selected === "consensus" ? <ConsensusLogo /> : <SportsbookLogo book={selected} decorative />}
        <span className="w-24">{selected === "consensus" ? "Consensus" : SPORTSBOOKS[selected].name}</span>
        <svg aria-hidden="true" className="transition-transform group-open:rotate-180" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-[var(--border)] bg-[var(--background)] p-1.5 shadow-lg" role="group" aria-label="Odds display options">
        {(["consensus", ...SPORTSBOOK_IDS] as const).map(book => <button key={book} type="button" aria-pressed={selected === book} onClick={() => select(book)} className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${selected === book ? "bg-[var(--surface-hover)]" : ""}`}>
          {book === "consensus" ? <ConsensusLogo /> : <SportsbookLogo book={book} decorative />}
          <span>{book === "consensus" ? "Average / Consensus" : SPORTSBOOKS[book].name}</span>
          {selected === book && <span aria-hidden="true" className="ml-auto text-[var(--accent)]">✓</span>}
        </button>)}
      </div>
    </details>
  </div>;
}
function ConsensusLogo() {
  return <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-lg text-[var(--accent)]">≈</span>;
}
function SportsbookLogo({ book, decorative = false }: { book: Sportsbook; decorative?: boolean }) {
  return <Image src={SPORTSBOOKS[book].logo} alt={decorative ? "" : SPORTSBOOKS[book].name} title={SPORTSBOOKS[book].name} width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />;
}
export function ConsensusBadge() {
  const { preferences } = useOddsPreferences();
  return preferences.mode === "consensus" ? <span className="text-xs font-medium text-[var(--accent)]">Consensus</span> : <SportsbookLogo book={preferences.sportsbook} />;
}
