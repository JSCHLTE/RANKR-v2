"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RankingHeader from "./RankingHeader";
import RankingList from "./RankingList";
import { RankingMeta } from "@/types/rank";

interface RankEntry { player_id: string; rank: number }
interface Props { meta: RankingMeta; ranks: RankEntry[] }

const RankingView = ({ meta, ranks }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState({ meta, ranks });
  const [draft, setDraft] = useState(saved);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const canEdit = user?.uid === saved.meta.author.uid;
  const editing = isEditing && canEdit;
  const current = editing ? draft : saved;

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
    saving.current = true;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/update-ranking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ rankingId: saved.meta.id, name: draft.meta.rankObj.name, description: draft.meta.rankObj.description ?? "", ranks: draft.ranks }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save ranking.");
      setSaved({ ...draft, meta: { ...draft.meta, updatedAt: result.updatedAt, rankObj: { ...draft.meta.rankObj, name: draft.meta.rankObj.name.trim() } } });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save ranking. Please try again.");
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return <>
    <RankingHeader meta={current.meta} isEditing={editing} isSaving={isSaving}
      onEdit={() => { if (canEdit) { setDraft(saved); setError(""); setIsEditing(true); } }}
      onCancel={() => { setDraft(saved); setError(""); setIsEditing(false); }}
      onSave={save}
      onChange={(field, value) => setDraft(previous => ({ ...previous, meta: { ...previous.meta, rankObj: { ...previous.meta.rankObj, [field]: value } } }))}
    />
    {error && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
    <RankingList author={saved.meta.author} ranks={current.ranks} isEditing={editing} isSaving={isSaving} onMove={movePlayer} />
  </>;
};

export default RankingView;
