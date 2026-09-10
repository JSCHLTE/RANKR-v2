"use client";

import { useEffect, useRef, useState } from "react";
import { PlayerLite } from "@/types/player";
import { getPositionColors } from "@/constants/positions";
import InjuryInfo from "./InjuryInfo";

interface Details {
  full_name?: string;
  age?: number | null;
  years_exp?: number | null;
  college?: string | null;
  position?: string;
}

export default function PlayerDetailsCard({ player, onClose }: { player: PlayerLite; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const position = details?.position || player.position;
  const colors = getPositionColors(position);

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/data/players/${encodeURIComponent(player.id)}.json`, { signal: controller.signal });
        if (!response.ok) throw new Error("Player details are unavailable right now.");
        const data = await response.json();
        const record = data[player.id];
        if (!record || typeof record !== "object") throw new Error("Player details are unavailable right now.");
        setDetails(record);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load player details.");
      }
    }
    void load();
    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [player.id]);

  return <dialog ref={dialog} onClose={onClose} aria-labelledby="player-card-name"
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}
    className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
    <button type="button" onClick={onClose} aria-label="Close player details" autoFocus className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xl text-[var(--text-muted)] hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">×</button>
    <div className="relative mx-auto mb-5 mt-2 w-32">
      <div aria-hidden="true" className={`absolute -inset-4 rounded-full blur-2xl opacity-40 ${colors.dot}`} />
      <img src={`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`} alt={player.fullName}
        onError={event => { event.currentTarget.onerror = null; if (!event.currentTarget.src.endsWith("player_default.webp")) event.currentTarget.src = "https://sleepercdn.com/images/v2/icons/player_default.webp"; }}
        className={`relative h-32 w-32 rounded-2xl border object-cover object-top bg-[var(--surface)] ${colors.border}`} />
    </div>
    <h2 id="player-card-name" className="text-center text-2xl font-semibold tracking-tight">{details?.full_name || player.fullName}</h2>
    <p className={`mt-1 text-center text-sm font-semibold ${colors.text}`}>{position || "—"}</p>
    {!details && !error && <p role="status" className="mt-6 text-center text-sm text-[var(--text-muted)]">Loading player details…</p>}
    {error && <p role="alert" className="mt-6 text-center text-sm text-[var(--text-muted)]">{error}</p>}
    {details && <dl className="mt-6 grid grid-cols-2 gap-4">
      {[
        ["Age", details.age ?? "—"],
        ["Experience", details.years_exp == null ? "—" : details.years_exp === 0 ? "Rookie" : `${details.years_exp} ${details.years_exp === 1 ? "year" : "years"}`],
        ["College", details.college || "—"],
        ["Position", position || "—"],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-[var(--surface-hover)] p-3">
        <dt className="mb-1 text-xs text-[var(--text-muted)]">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>)}
    </dl>}
    {player.injury && <div className="mt-6"><InjuryInfo player={player} /></div>}
  </dialog>;
}
