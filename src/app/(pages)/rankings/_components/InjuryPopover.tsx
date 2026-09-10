"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlayerLite } from "@/types/player";
import InjuryInfo, { injuryColor } from "./InjuryInfo";

export default function InjuryPopover({ player }: { player: PlayerLite }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  function cancelClose() { if (timer.current) clearTimeout(timer.current); }
  function open() {
    cancelClose();
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 348)), top: rect.bottom + 8 });
  }
  function closeSoon() { cancelClose(); timer.current = setTimeout(() => setPosition(null), 150); }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!position) return;
    const dismiss = (event: Event) => {
      if (trigger.current?.contains(event.target as Node) || panel.current?.contains(event.target as Node)) return;
      setPosition(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setPosition(null); } };
    const resize = () => setPosition(null);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape, true);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape, true);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", resize);
    };
  }, [position]);

  return <>
    <button ref={trigger} type="button" aria-label={`Injury information for ${player.fullName}`} aria-expanded={!!position} aria-controls={position ? id : undefined}
      onMouseEnter={open} onMouseLeave={closeSoon} onFocus={open} onBlur={closeSoon}
      onPointerDown={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
      onClick={event => { event.stopPropagation(); open(); }}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${injuryColor(player.injurySeverity)}`}>
      <span aria-hidden="true" className="h-4 w-4 bg-current" style={{ mask: "url('/injury.svg') center / contain no-repeat", WebkitMask: "url('/injury.svg') center / contain no-repeat" }} />
    </button>
    {position && createPortal(<div ref={panel} id={id} role="region" aria-label={`${player.fullName} injury details`}
      onMouseEnter={cancelClose} onMouseLeave={closeSoon} onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}
      className="fixed z-[100] w-[340px] max-w-[calc(100vw_-_16px)] overflow-y-auto rounded-xl bg-[var(--background)] shadow-xl"
      style={{ left: position.left, top: position.top > window.innerHeight / 2 ? undefined : position.top,
        bottom: position.top > window.innerHeight / 2 ? Math.max(8, window.innerHeight - position.top + 32) : undefined,
        maxHeight: "min(440px, 45vh)" }}>
      <InjuryInfo player={player} />
    </div>, document.body)}
  </>;
}
