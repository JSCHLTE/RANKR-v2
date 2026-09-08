"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ResolvedPlayer } from "@/types/player";
import PlayerRow from "../_components/PlayerRow";
import { rankBelowPlayer } from "@/lib/ranking-reorder";

interface SortableRowProps extends ResolvedPlayer {
  selected: boolean;
  onSelect: (playerId: string) => void;
}

const SortableRow = memo(function SortableRow({ rank, player, positionalRank, selected, onSelect }: SortableRowProps) {
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
      className={`select-none cursor-grab [&_*]:cursor-grab active:cursor-grabbing active:[&_*]:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:-outline-offset-2 ${selected ? "bg-[var(--accent)]/10 ring-1 ring-inset ring-[var(--accent)]" : ""}`}
    >
      <PlayerRow rank={rank} player={player} positionalRank={positionalRank} />
    </div>
  );
});

interface Props {
  players: ResolvedPlayer[];
  onMove: (playerId: string, targetRank: number) => void;
}

export default function SortableRankingRows({ players, onMove }: Props) {
  const suppressClick = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePlayer = players.find(({ player }) => player.id === activeId);
  const itemIds = useMemo(() => players.map(({ player }) => player.id), [players]);
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
        // Use the target's overall rank, including when search or position filters hide other players.
        const target = players.find(({ player }) => player.id === over.id);
        if (target) onMove(String(active.id), target.rank);
      }}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {players.map(entry => <SortableRow key={entry.player.id} {...entry} selected={selectedId === entry.player.id} onSelect={selectPlayer} />)}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activePlayer && <div className="bg-[var(--surface)] shadow-lg ring-1 ring-[var(--accent)] cursor-grabbing [&_*]:cursor-grabbing select-none">
          <PlayerRow {...activePlayer} />
        </div>}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
