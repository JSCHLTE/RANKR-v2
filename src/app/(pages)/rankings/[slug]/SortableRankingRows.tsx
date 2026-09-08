"use client";

import { useState } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ResolvedPlayer } from "@/types/player";
import PlayerRow from "../_components/PlayerRow";

function SortableRow({ rank, player, positionalRank }: ResolvedPlayer) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${player.fullName}, rank ${rank}`}
      onDragStart={event => event.preventDefault()}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className="select-none cursor-grab [&_*]:cursor-grab active:cursor-grabbing active:[&_*]:cursor-grabbing focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:-outline-offset-2"
    >
      <PlayerRow rank={rank} player={player} positionalRank={positionalRank} />
    </div>
  );
}

interface Props {
  players: ResolvedPlayer[];
  onMove: (playerId: string, targetRank: number) => void;
}

export default function SortableRankingRows({ players, onMove }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePlayer = players.find(({ player }) => player.id === activeId);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        // Use the target's overall rank, including when search or position filters hide other players.
        const target = players.find(({ player }) => player.id === over.id);
        if (target) onMove(String(active.id), target.rank);
      }}
    >
      <SortableContext items={players.map(({ player }) => player.id)} strategy={verticalListSortingStrategy}>
        {players.map(entry => <SortableRow key={entry.player.id} {...entry} />)}
      </SortableContext>
      <DragOverlay>
        {activePlayer && <div className="bg-[var(--surface)] shadow-lg ring-1 ring-[var(--accent)] cursor-grabbing [&_*]:cursor-grabbing select-none">
          <PlayerRow {...activePlayer} />
        </div>}
      </DragOverlay>
    </DndContext>
  );
}
