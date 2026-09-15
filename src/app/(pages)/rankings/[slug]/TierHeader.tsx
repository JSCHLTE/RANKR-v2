"use client";
import type { ReactNode } from "react";
import { tierColors, type RankingTier } from "@/lib/ranking-tiers";

export default function TierHeader({ tier, handle, onRename, onRemove }: { tier: RankingTier; handle?: ReactNode; onRename?: (name: string) => void; onRemove?: () => void }) {
  const color = tierColors[tier.color] ?? tierColors[6];
  return <div className="flex min-h-12 items-center gap-3 border-y border-[var(--border)] px-4 py-2" style={{ backgroundColor: `${color}22`, borderLeft: `4px solid ${color}` }}>
    {handle}
    {onRename ? <input aria-label="Tier name" value={tier.name} maxLength={15} onChange={event => onRename(event.target.value)} className="w-40 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm font-bold" /> : <h3 className="text-sm font-bold">{tier.name}</h3>}
    <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Tier</span>
    {onRemove && <button type="button" onClick={onRemove} aria-label={`Remove ${tier.name} tier`} className="ml-auto cursor-pointer rounded px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]">Remove</button>}
  </div>;
}
