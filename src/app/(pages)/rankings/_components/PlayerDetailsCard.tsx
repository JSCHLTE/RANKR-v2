"use client";

import { useEffect, useRef, useState } from "react";
import { PlayerLite } from "@/types/player";
import { getPositionColors } from "@/constants/positions";
import InjuryInfo from "./InjuryInfo";
import CareerStats from "./CareerStats";
import WeeklyStats from "./WeeklyStats";
import styles from "./PlayerProfile.module.css";

interface Details { full_name?: string; age?: number | null; years_exp?: number | null; college?: string | null; position?: string }

export default function PlayerDetailsCard({ player, onClose }: { player: PlayerLite; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("Career");
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
        if (!response.ok) throw new Error("Additional player details are unavailable right now.");
        const data = await response.json();
        const record = data[player.id];
        if (!record || typeof record !== "object") throw new Error("Additional player details are unavailable right now.");
        setDetails(record);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load player details.");
      }
    }
    void load();
    return () => { controller.abort(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [player.id]);
  const experience = details?.years_exp ?? player.yearsExp;
  return <dialog ref={dialog} onClose={onClose} aria-labelledby="player-card-name" className={styles.profile}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <button type="button" onClick={onClose} aria-label="Close player details" autoFocus className={styles.close}>×</button>
    <header className={styles.header}>
      <img src={`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`} alt={player.fullName}
        onError={event => { event.currentTarget.onerror = null; if (!event.currentTarget.src.endsWith("player_default.webp")) event.currentTarget.src = "https://sleepercdn.com/images/v2/icons/player_default.webp"; }} className={styles.portrait} />
      <div><p className={styles.eyebrow}>RANKR / PLAYER PROFILE</p><h2 id="player-card-name">{details?.full_name || player.fullName}</h2>
        <p className={`text-sm font-semibold ${colors.text}`}>{position || "—"} <span className="text-[var(--text-muted)]">· {player.team || "Free agent"}</span></p>
        <dl className={styles.metadata}>{[["Age", details?.age ?? "—"], ["Experience", experience == null ? "—" : experience === 0 ? "Rookie" : `${experience} ${experience === 1 ? "year" : "years"}`], ["College", details?.college || "—"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {!details && !error && <p role="status" className={styles.footnote}>Loading player details…</p>}
        {error && <p role="status" className={styles.footnote}>{error}</p>}
        {player.injury && <details className="mt-2 text-sm"><summary className="cursor-pointer text-[var(--danger)]">Injury · {player.injuryName || "View update"}</summary><div className="mt-2"><InjuryInfo player={player} /></div></details>}
      </div>
    </header>
    <div className={styles.tabs} aria-label="Profile view">{["Career", "Seasonal"].map(tab => <button key={tab} type="button" aria-pressed={view === tab} onClick={() => setView(tab)}>{tab}</button>)}</div>
    <div hidden={view !== "Seasonal"}><WeeklyStats key={player.id} playerId={player.id} /></div>
    <div hidden={view !== "Career"}><CareerStats key={player.id} playerId={player.id} /></div>
  </dialog>;
}
