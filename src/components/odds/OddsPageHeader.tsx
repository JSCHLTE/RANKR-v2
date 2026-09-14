import type { ReactNode } from "react";
import { updatedTime } from "./OddsValue";
export function OddsPageHeader({ title, season, week, updatedAt, isMock }: { title: ReactNode; season: number; week: number; updatedAt: string; isMock: boolean }) {
  return <header className="mb-6"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">NFL odds · {season} · Week {week}</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 text-xs text-[var(--text-muted)]">{isMock ? "Mock data · Illustrative matchups, dates and prices · " : ""}{updatedAt ? `Last updated ${updatedTime(updatedAt)}` : "No odds published yet"}</p></header>;
}
