"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ResolvedPlayer } from "@/types/player";
import PlayerRow from "../_components/PlayerRow";
import { rankBelowPlayer } from "@/lib/ranking-reorder";
import { tierDropRank, type RankingTier } from "@/lib/ranking-tiers";
import TierHeader from "./TierHeader";

function SortableTier({ tier, onRename, onRemove }: { tier: RankingTier; onRename: (name: string) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: `tier:${tier.id}` });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}><TierHeader tier={tier} onRename={onRename} onRemove={onRemove} handle={<button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Move ${tier.name} tier`} className="touch-none cursor-grab px-2 py-1 active:cursor-grabbing">⠿</button>} /></div>;
}
function EndTarget() {
  const { setNodeRef, isOver } = useDroppable({ id: "tiers:end" });
  return <div ref={setNodeRef} className={`p-4 text-center text-xs text-[var(--text-muted)] ${isOver ? "bg-[var(--accent)]/15" : ""}`}>Drop a tier here to place it after the last player</div>;
}

interface SortableRowProps extends ResolvedPlayer {
  selected: boolean;
  canInsertBelow: boolean;
  onSelect: (playerId: string) => void;
}

const SortableRow = memo(function SortableRow({ rank, player, positionalRank, selected, canInsertBelow, onSelect }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
    transition: { duration: 100, easing: "ease-out" },
    animateLayoutChanges: () => false,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${player.fullName}, rank ${rank}`}
      aria-pressed={selected}
      onClick={() => onSelect(player.id)}
      onKeyDown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSelect(player.id);
        } else {
          listeners?.onKeyDown?.(event);
        }
      }}
      onDragStart={event => event.preventDefault()}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`group/reorder relative select-none cursor-grab [&_*]:cursor-grab active:cursor-grabbing active:[&_*]:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:-outline-offset-2 ${selected ? "bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]" : ""}`}
    >
      <PlayerRow rank={rank} player={player} positionalRank={positionalRank} />
      {canInsertBelow && <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent)] opacity-0 group-hover/reorder:opacity-100 group-focus-visible/reorder:opacity-100" />}
    </div>
  );
});

interface Props {
  players: ResolvedPlayer[];
  onMove: (playerId: string, targetRank: number) => void;
  tiers?: RankingTier[];
  playerCount?: number;
  onMoveTier?: (id: string, rank: number, targetTier?: string) => void;
  onRenameTier?: (id: string, name: string) => void;
  onRemoveTier?: (id: string) => void;
}

export default function SortableRankingRows({ players, onMove, tiers = [], playerCount = players.length, onMoveTier = () => {}, onRenameTier = () => {}, onRemoveTier = () => {} }: Props) {
  const suppressClick = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePlayer = players.find(({ player }) => player.id === activeId);
  const rows = useMemo(() => [
    ...players.map(entry => ({ id: entry.player.id, rank: entry.rank, entry, tier: undefined as RankingTier | undefined })),
    ...tiers.map(tier => ({ id: `tier:${tier.id}`, rank: tier.beforeRank, entry: undefined as ResolvedPlayer | undefined, tier })),
  ].sort((a, b) => a.rank - b.rank || (a.tier ? 0 : 1) - (b.tier ? 0 : 1)), [players, tiers]);
  const itemIds = useMemo(() => [...rows.map(row => row.id), "tiers:end"], [rows]);
  const activeTier = tiers.find(tier => `tier:${tier.id}` === activeId);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 2 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  const selectPlayer = useCallback((playerId: string) => {
    // A completed drag must never also act as a click-to-move gesture.
    if (suppressClick.current) return;
    if (selectedId === playerId) { setSelectedId(null); return; }
    const source = players.find(({ player }) => player.id === selectedId);
    const target = players.find(({ player }) => player.id === playerId);
    if (!source) { setSelectedId(playerId); return; }
    if (target) onMove(source.player.id, rankBelowPlayer(source.rank, target.rank));
    setSelectedId(null);
  }, [players, selectedId, onMove]);

  return (
    <div onPointerDownCapture={() => { suppressClick.current = false; }}
      onKeyDownCapture={event => {
        if (event.key === "Escape") setSelectedId(null);
        if (!activeId && event.key === "Enter") suppressClick.current = false;
      }}>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{ screenReaderInstructions: { draggable: "Press Enter to select a player, then Enter on another row to move below it. Press Space to pick up a row, arrow keys to move, and Space to drop. Press Escape to cancel." } }}
      onDragStart={({ active }) => {
        suppressClick.current = true;
        setSelectedId(null);
        setActiveId(String(active.id));
      }}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const sourceTier = tiers.find(tier => `tier:${tier.id}` === active.id);
        const targetTier = tiers.find(tier => `tier:${tier.id}` === over.id);
        if (sourceTier) {
          const targetPlayer = players.find(({ player }) => player.id === over.id);
          const rank = over.id === "tiers:end" ? playerCount + 1 : targetTier?.beforeRank ?? (targetPlayer ? tierDropRank(sourceTier.beforeRank, targetPlayer.rank) : undefined);
          if (rank !== undefined) onMoveTier(sourceTier.id, rank, targetTier?.id);
          return;
        }
        if (targetTier) { onMove(String(active.id), Math.min(targetTier.beforeRank, playerCount)); return; }
        if (over.id === "tiers:end") { onMove(String(active.id), playerCount); return; }
        // Use the target's overall rank, including when search or position filters hide other players.
        const target = players.find(({ player }) => player.id === over.id);
        if (target) onMove(String(active.id), target.rank);
      }}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {rows.map(row => row.tier ? <SortableTier key={row.id} tier={row.tier} onRename={name => onRenameTier(row.tier!.id, name)} onRemove={() => onRemoveTier(row.tier!.id)} /> : row.entry && <SortableRow key={row.id} {...row.entry} selected={selectedId === row.id} canInsertBelow={selectedId !== null && selectedId !== row.id && activeId === null} onSelect={selectPlayer} />)}
        {tiers.length > 0 && <EndTarget />}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeTier && <div className="bg-[var(--background)] shadow-lg"><TierHeader tier={activeTier} /></div>}
        {activePlayer && <div className="bg-[var(--surface)] shadow-lg ring-1 ring-[var(--accent)] cursor-grabbing [&_*]:cursor-grabbing select-none">
          <PlayerRow {...activePlayer} />
        </div>}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
