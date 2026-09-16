"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RankingHeader from "./RankingHeader";
import RankingList from "./RankingList";
import { RankingMeta } from "@/types/rank";
import { nextTier, type RankingTier } from "@/lib/ranking-tiers";
import { DraftMode } from "@/components/DraftMode";

interface RankEntry { player_id: string; rank: number }
interface Props { meta: RankingMeta; ranks: RankEntry[]; tiers?: RankingTier[] }

const RankingView = ({ meta, ranks, tiers = [] }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState({ meta, ranks, tiers });
  const [draft, setDraft] = useState(saved);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const isOwner = user?.uid === saved.meta.author.uid;
  const accessKey = `${user?.uid}:${saved.meta.id}`;
  const [access, setAccess] = useState<{ key: string; canEdit: boolean; isOldest: boolean; expiresAt: number | null; error?: string }>();
  const currentAccess = access?.key === accessKey ? access : undefined;
  const canEdit = isOwner && currentAccess?.canEdit === true;
  useEffect(() => {
    if (!isOwner || !user) return;
    const controller = new AbortController();
    async function checkAccess() {
      try {
        const token = await user!.getIdToken();
        if (controller.signal.aborted) return;
        const response = await fetch(`/api/update-ranking?id=${encodeURIComponent(saved.meta.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Unable to check editing access. Refresh to try again.");
        const result = await response.json();
        if (!controller.signal.aborted) setAccess({ ...result, key: accessKey });
      } catch (error) {
        if (!controller.signal.aborted) setAccess({ key: accessKey, canEdit: false, isOldest: false, expiresAt: null, error: error instanceof Error ? error.message : "Unable to check editing access." });
      }
    }
    void checkAccess();
    window.addEventListener("focus", checkAccess);
    return () => { controller.abort(); window.removeEventListener("focus", checkAccess); };
  }, [isOwner, user, saved.meta.id, accessKey]);
  useEffect(() => {
    if (!currentAccess?.canEdit || currentAccess.isOldest || !currentAccess.expiresAt) return;
    const timer = window.setInterval(() => {
      if (Date.now() >= currentAccess.expiresAt!) setAccess(previous => previous?.key === accessKey ? { ...previous, canEdit: false } : previous);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentAccess, accessKey]);
  const editing = isEditing && canEdit;
  const current = editing ? draft : saved;

  function addTier() {
    if (!editing || saving.current) return;
    const id = crypto.randomUUID();
    setDraft(previous => previous.tiers.length >= 100 ? previous : { ...previous, tiers: [...previous.tiers, { id, ...nextTier(previous.tiers) }] });
  }
  function changeTier(id: string, name: string) {
    if (!editing || saving.current) return;
    setDraft(previous => ({ ...previous, tiers: previous.tiers.map(tier => tier.id === id ? { ...tier, name: name.slice(0, 15) } : tier) }));
  }
  function removeTier(id: string) {
    if (!editing || saving.current) return;
    setDraft(previous => ({ ...previous, tiers: previous.tiers.filter(tier => tier.id !== id) }));
  }
  function moveTier(id: string, beforeRank: number, targetTier?: string) {
    if (!editing || saving.current) return;
    setDraft(previous => {
      const moving = previous.tiers.find(tier => tier.id === id);
      if (!moving || beforeRank < 1 || beforeRank > previous.ranks.length + 1) return previous;
      const ordered = [...previous.tiers].sort((a, b) => a.beforeRank - b.beforeRank);
      const tiers = ordered.filter(tier => tier.id !== id);
      const targetIndex = tiers.findIndex(tier => tier.id === targetTier);
      const wasAbove = ordered.findIndex(tier => tier.id === id) < ordered.findIndex(tier => tier.id === targetTier);
      tiers.splice(targetIndex < 0 ? tiers.length : targetIndex + (wasAbove ? 1 : 0), 0, { ...moving, beforeRank });
      return { ...previous, tiers };
    });
  }

  function movePlayer(playerId: string, targetRank: number) {
    if (!editing || saving.current) return;
    setDraft(previous => {
      const ordered = [...previous.ranks].sort((a, b) => a.rank - b.rank);
      const index = ordered.findIndex(entry => entry.player_id === playerId);
      if (index < 0 || !Number.isInteger(targetRank) || targetRank < 1 || targetRank > ordered.length) return previous;
      const [entry] = ordered.splice(index, 1);
      ordered.splice(targetRank - 1, 0, entry);
      return { ...previous, ranks: ordered.map((item, i) => ({ ...item, rank: i + 1 })) };
    });
  }

  async function save() {
    if (!editing || !user || saving.current) return;
    if (draft.tiers.some(tier => !tier.name.trim())) { setError("Give every tier a name before saving."); return; }
    saving.current = true;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/update-ranking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ rankingId: saved.meta.id, name: draft.meta.rankObj.name, description: draft.meta.rankObj.description ?? "", ranks: draft.ranks, tiers: draft.tiers }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.code === "RANKING_EDIT_LOCKED") setAccess({ key: accessKey, canEdit: false, isOldest: false, expiresAt: null });
        throw new Error(result.error || "Unable to save ranking.");
      }
      setSaved({ ...draft, tiers: draft.tiers.map(tier => ({ ...tier, name: tier.name.trim() })), meta: { ...draft.meta, updatedAt: result.updatedAt, rankObj: { ...draft.meta.rankObj, name: draft.meta.rankObj.name.trim() } } });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save ranking. Please try again.");
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  async function deleteRanking() {
    if (!isOwner || !user || editing || saving.current) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${saved.meta.rankObj.name}"?`)) return;
    saving.current = true;
    setIsDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/delete-ranking", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ rankingId: saved.meta.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete ranking.");
      router.replace("/rankings");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to delete ranking. Please try again.");
      saving.current = false;
      setIsDeleting(false);
    }
  }

  return <>
    <RankingHeader meta={current.meta} isEditing={editing} isSaving={isSaving} isDeleting={isDeleting}
      onEdit={canEdit ? () => { if (!saving.current) { setDraft(saved); setError(""); setIsEditing(true); } } : undefined}
      onDelete={deleteRanking}
      onCancel={() => { setDraft(saved); setError(""); setIsEditing(false); }}
      onSave={save}
      onChange={(field, value) => setDraft(previous => ({ ...previous, meta: { ...previous.meta, rankObj: { ...previous.meta.rankObj, [field]: value } } }))}
    />
    {isOwner && !currentAccess && <p role="status" className="mb-4 text-sm text-[var(--text-muted)]">Checking editing access…</p>}
    {isOwner && currentAccess?.error && <p role="alert" className="mb-4 text-sm text-red-400">{currentAccess.error}</p>}
    {isOwner && currentAccess && !currentAccess.canEdit && !currentAccess.error && <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">This ranking is view-only. Free accounts can edit their two oldest rankings, including public and private rankings. <Link href="/subscribe" className="text-[var(--accent)] underline">Get RANKR Pass to restore editing.</Link></p>}
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    {editing && <div className="mb-4 flex items-center gap-3"><button type="button" disabled={isSaving || draft.tiers.length >= 100} onClick={addTier} className="cursor-pointer rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-50">+ Add tier</button><p className="text-xs text-[var(--text-muted)]">Drag tier headers to set boundaries. Changes apply when you save.</p></div>}
    <DraftMode rankingId={saved.meta.id} playerIds={current.ranks.map(entry => entry.player_id)} disabled={editing || isDeleting}>
      <RankingList author={saved.meta.author} ranks={current.ranks} tiers={current.tiers} isEditing={editing} isSaving={isSaving} onMove={movePlayer} onMoveTier={moveTier} onRenameTier={changeTier} onRemoveTier={removeTier} />
    </DraftMode>
  </>;
};

export default RankingView;
