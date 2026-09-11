"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/admin-access";
import { TemplatePlayer, TemplateSnapshot, templateError } from "@/lib/template-data";
import { normalizePlayers } from "@/lib/normalize-players";
import SortableRankingRows from "../rankings/[slug]/SortableRankingRows";

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm";
const buttonClass = "rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-hover)] disabled:opacity-40";
const newPlayer = (): TemplatePlayer => ({ player_id: "", first_name: "", last_name: "", team: "", fantasy_positions: ["RB"], injury: false, injury_severity: "low", injury_name: "", injury_note: "", injury_expected_return: "", injury_reinjury_risk: "" });

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState<TemplateSnapshot | null>(null);
  const [draft, setDraft] = useState<TemplateSnapshot | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<TemplatePlayer | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const inFlight = useRef(false);
  const allowed = isAdmin(user?.uid);
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    if (!user || !isAdmin(user.uid)) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/template", { headers: { Authorization: `Bearer ${await user!.getIdToken()}` }, signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) { setSaved(data); setDraft(data); setError(""); setEditor(null); }
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load template.");
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [user, reload]);

  useEffect(() => {
    if (!dirty && !editor) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, editor]);

  const resolved = useMemo(() => {
    if (!draft) return [];
    const players = normalizePlayers(draft.players);
    return [...draft.ranks].sort((a, b) => a.rank - b.rank).map(entry => ({ rank: entry.rank, player: players[entry.player_id] }));
  }, [draft]);

  async function save() {
    if (!user || !allowed || !draft || inFlight.current) return;
    const validation = templateError(draft);
    if (validation) { setError(validation); return; }
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/template", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const updated = { ...draft, revision: result.revision };
      setDraft(updated); setSaved(updated); setMessage("Saved both JSON files. New rankings will use this template.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save template."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  function applyPlayer() {
    if (!editor || !draft) return;
    const player = { ...editor, player_id: editor.player_id.trim(), first_name: editor.first_name.trim(), last_name: editor.last_name.trim(), search_full_name: `${editor.first_name}${editor.last_name}`.toLowerCase().replace(/[^a-z0-9]/g, "") };
    if (creating && draft.players.some(p => p.player_id === player.player_id)) { setError("That player ID already exists."); return; }
    const next = { ...draft, players: creating ? [...draft.players, player] : draft.players.map(p => p.player_id === player.player_id ? player : p) };
    const validation = templateError(next);
    if (validation) { setError(validation); return; }
    setDraft(next); setEditor(null); setError(""); setMessage("");
  }

  if (loading) return <main className="mx-auto max-w-5xl p-6">Checking access…</main>;
  if (!allowed) return <main className="mx-auto max-w-5xl p-6"><h1 className="text-xl font-semibold">Admin access required</h1><p className="mt-2 text-[var(--text-muted)]">Sign in with the authorized admin account.</p></main>;

  return <main className="mx-auto max-w-5xl px-4 py-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">Template admin</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Edit player metadata and the starting order for new rankings.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className={buttonClass} disabled={busy || refreshing || !dirty || !!editor} onClick={save}>{busy ? "Saving…" : "Save template"}</button>
        <button className={buttonClass} disabled={busy || (!dirty && !editor)} onClick={() => { setDraft(saved); setEditor(null); setError(""); setMessage(""); }}>Discard edits</button>
        <button className={buttonClass} disabled={busy || refreshing} onClick={() => { if ((!dirty && !editor) || window.confirm("Discard local edits and reload the template?")) { setRefreshing(true); setReload(n => n + 1); setMessage(""); } }}>Reload</button>
      </div>
    </div>
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    {message && <p role="status" className="mb-4 text-sm text-[var(--accent)]">{message}</p>}
    {!draft || refreshing ? <p>{error ? "Use Reload to try again." : "Loading template…"}</p> : <fieldset disabled={busy} className="min-w-0 space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Players ({draft.players.length})</h2><button className={buttonClass} disabled={!!editor} onClick={() => { setCreating(true); setEditor(newPlayer()); }}>New player</button></div>
        {editor ? <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {([['player_id', 'Player ID'], ['first_name', 'First name'], ['last_name', 'Last name'], ['team', 'Team'], ['injury_name', 'Injury name'], ['injury_expected_return', 'Expected return'], ['injury_reinjury_risk', 'Reinjury risk']] as const).map(([field, label]) => <label key={field} className="space-y-1 text-xs text-[var(--text-muted)]">{label}<input className={inputClass} disabled={field === "player_id" && !creating} value={editor[field] ?? ""} onChange={event => setEditor({ ...editor, [field]: event.target.value })} /></label>)}
            <label className="space-y-1 text-xs text-[var(--text-muted)]">Positions (comma separated)<input className={inputClass} value={editor.fantasy_positions.join(", ")} onChange={event => setEditor({ ...editor, fantasy_positions: event.target.value.toUpperCase().split(",").map(p => p.trim()) })} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editor.injury ?? false} onChange={event => setEditor({ ...editor, injury: event.target.checked })} />Injured</label>
            <label className="space-y-1 text-xs text-[var(--text-muted)]">Injury severity<select className={inputClass} value={editor.injury_severity ?? ""} onChange={event => setEditor({ ...editor, injury_severity: event.target.value })}>{["", "low", "medium", "high"].map(value => <option key={value} value={value}>{value || "Unknown"}</option>)}</select></label>
          </div>
          <label className="block space-y-1 text-xs text-[var(--text-muted)]">Injury notes<textarea rows={3} className={inputClass} value={editor.injury_note ?? ""} onChange={event => setEditor({ ...editor, injury_note: event.target.value })} /></label>
          <div className="flex gap-2"><button className={buttonClass} onClick={applyPlayer}>Apply to draft</button><button className={buttonClass} onClick={() => setEditor(null)}>Cancel</button></div>
        </div> : <>
          <input aria-label="Search player names or IDs" placeholder="Search name or player ID…" className={inputClass} value={search} onChange={event => setSearch(event.target.value)} />
          <div className="mt-3 max-h-80 overflow-y-auto">
            {draft.players.filter(p => `${p.player_id} ${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())).map(player => {
              const ranked = draft.ranks.some(entry => entry.player_id === player.player_id);
              return <div key={player.player_id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] py-2 text-sm">
                <span>{player.first_name} {player.last_name} <span className="text-xs text-[var(--text-muted)]">{player.player_id} · {player.fantasy_positions.join(" / ")}</span></span>
                <div className="flex gap-2"><button className={buttonClass} onClick={() => { setCreating(false); setEditor({ ...player }); }}>Edit</button>
                  <button className={buttonClass} disabled={ranked && draft.ranks.length === 1} onClick={() => { setMessage(""); setDraft({ ...draft, ranks: ranked ? draft.ranks.filter(entry => entry.player_id !== player.player_id).map((entry, i) => ({ ...entry, rank: i + 1 })) : [...draft.ranks, { player_id: player.player_id, rank: draft.ranks.length + 1 }] }); }}>{ranked ? "Remove from template" : "Add to template"}</button></div>
              </div>;
            })}
          </div>
        </>}
      </section>
      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <h2 className="p-4 font-semibold">Template order ({draft.ranks.length})</h2>
        <p className="px-4 pb-3 text-xs text-[var(--text-muted)]">Drag rows or select a player and click another row to place it below. Removing a player here keeps their metadata available for existing rankings.</p>
        {busy ? <p className="p-4">Saving…</p> : <SortableRankingRows players={resolved} onMove={(id, rank) => {
          if (inFlight.current) return;
          setMessage("");
          setDraft(previous => {
            if (!previous) return previous;
            const order = [...previous.ranks].sort((a, b) => a.rank - b.rank);
            const index = order.findIndex(entry => entry.player_id === id);
            if (index < 0 || rank < 1 || rank > order.length) return previous;
            const [entry] = order.splice(index, 1); order.splice(rank - 1, 0, entry);
            return { ...previous, ranks: order.map((entry, index) => ({ ...entry, rank: index + 1 })) };
          });
        }} />}
      </section>
    </fieldset>}
  </main>;
}
