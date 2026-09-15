"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import AccountAction from "./AccountAction";
import { draftStorageKey, emptyDraft, readDraft, togglePick, type DraftPick } from "@/lib/draft-mode";
import type { ResolvedPlayer } from "@/types/player";
import Image from "next/image";
import { getPositionColors } from "@/constants/positions";

function RosterHeadshot({ id, defense }: { id: string; defense: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--surface-hover)]">
    {failed ? <span aria-hidden="true" className="text-xs text-[var(--text-muted)]">—</span> : <Image unoptimized src={defense ? `https://sleepercdn.com/images/team_logos/nfl/${id.toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/${id}.jpg`} alt="" width={32} height={32} className={defense ? "h-full w-full object-contain" : "h-full w-full object-cover"} onError={() => setFailed(true)} />}
  </span>;
}

const DraftContext = createContext<{ active: boolean; picks: Record<string, DraftPick>; mark: (id: string, pick: DraftPick) => void }>({ active: false, picks: {}, mark: () => {} });
export const useDraftMode = () => useContext(DraftContext);

export function DraftMode({ rankingId, playerIds, disabled, children }: { rankingId: string; playerIds: string[]; disabled: boolean; children: ReactNode }) {
  const { user } = useAuth();
  return <DraftSession key={`${user?.uid ?? "guest"}:${rankingId}`} uid={user?.uid} rankingId={rankingId} playerIds={playerIds} disabled={disabled}>{children}</DraftSession>;
}
function DraftSession({ uid, rankingId, playerIds, disabled, children }: { uid?: string; rankingId: string; playerIds: string[]; disabled: boolean; children: ReactNode }) {
  const [state, setState] = useState(emptyDraft);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const key = uid ? draftStorageKey(uid, rankingId) : null;
  // Restore before enabling controls or persisting; never overwrite a saved draft with initial state.
  useEffect(() => {
    let restored = emptyDraft();
    try { if (key) restored = readDraft(localStorage.getItem(key), playerIds); }
    catch { /* Browser storage may be disabled; in-memory drafting still works. */ }
    queueMicrotask(() => { setState(restored); setReady(true); });
    // The keyed session isolates account/ranking changes. Player IDs are the initial board snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!ready || !key) return;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { queueMicrotask(() => setStorageError(true)); }
  }, [state, ready, key]);
  const active = !!uid && ready && state.active && !disabled;
  function mark(id: string, pick: DraftPick) {
    if (active && playerIds.includes(id)) setState(previous => togglePick(previous, id, pick));
  }
  return <DraftContext.Provider value={{ active, picks: active ? state.picks : {}, mark }}>
    {!disabled && <div className="mb-4 flex flex-wrap items-center gap-3">
      <AccountAction disabled={!!uid && !ready} onClick={() => setState(previous => ({ ...previous, active: !previous.active }))} className="cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-50">{active ? "Exit draft mode" : "Draft mode"}</AccountAction>
      {active && <button type="button" className="cursor-pointer text-xs text-[var(--text-muted)] underline" onClick={() => { if (window.confirm("Clear all draft picks for this ranking on this device?")) setState({ active: true, picks: {} }); }}>Reset draft</button>}
      {active && storageError && <p className="w-full text-xs text-[var(--text-muted)]">Browser storage is unavailable. Picks will last only while this page stays open.</p>}
    </div>}
    {children}
  </DraftContext.Provider>;
}

export function DraftControls({ id, name }: { id: string; name: string }) {
  const { picks, mark } = useDraftMode();
  return <div className="flex shrink-0 gap-1 px-1">{(["mine", "other"] as const).map(pick => <button key={pick} type="button" aria-label={`${pick === "mine" ? "I drafted" : "Someone else drafted"} ${name}`} aria-pressed={picks[id] === pick} title={pick === "mine" ? "I drafted this player" : "Someone else drafted this player"} onClick={() => mark(id, pick)} className={`h-9 w-9 cursor-pointer rounded-md border text-lg font-bold focus-visible:outline-[var(--accent)] ${picks[id] === pick ? pick === "mine" ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]" : "border-red-400 bg-red-400/15 text-red-400" : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"}`}>{pick === "mine" ? "✓" : "×"}</button>)}</div>;
}

export function DraftRoster({ players }: { players: ResolvedPlayer[] }) {
  const { picks, mark } = useDraftMode();
  const mine = players.filter(({ player }) => picks[player.id] === "mine");
  const positions = ["QB", "RB", "WR", "TE", "K", "DEF"];
  const position = (entry: ResolvedPlayer) => {
    const pos = entry.player.fantasyPositions?.[0] || entry.player.position;
    return pos === "DST" ? "DEF" : pos;
  };
  const groups = [...positions, ...(mine.some(entry => !positions.includes(position(entry))) ? ["Other"] : [])];
  const roster = <div className="space-y-4 p-4">{groups.map(pos => <section key={pos}><h3 className="mb-2 text-xs font-bold tracking-wider text-[var(--accent)]">{pos}</h3>{mine.filter(entry => pos === "Other" ? !positions.includes(position(entry)) : position(entry) === pos).map(entry => {
    const { player } = entry;
    const tag = position(entry);
    const colors = getPositionColors(tag);
    return <div key={player.id} className="flex items-center gap-2 py-1.5 text-sm"><RosterHeadshot id={player.id} defense={tag === "DEF"} /><div className="min-w-0 flex-1"><span className="break-words">{player.fullName}</span>{" "}<span className={`inline-flex rounded border px-1.5 py-0.5 align-middle text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}>{tag}</span></div><button type="button" aria-label={`Undo drafting ${player.fullName}`} onClick={() => mark(player.id, "mine")} className="shrink-0 cursor-pointer px-2 py-1 text-[var(--text-muted)]">×</button></div>;
  })}</section>)}</div>;
  return <>
    <details className="rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-md lg:hidden"><summary className="cursor-pointer p-3 text-sm font-semibold">My roster ({mine.length})</summary><div className="max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain">{roster}</div></details>
    <aside aria-label="My drafted roster" className="sticky top-6 hidden max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] lg:block"><h2 className="border-b border-[var(--border)] p-4 font-semibold">My roster ({mine.length})</h2>{roster}</aside>
  </>;
}
