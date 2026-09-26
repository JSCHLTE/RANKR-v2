"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isAdmin } from "@/lib/admin-access";

export function WeekSelector({ season, week, weeks, className = "" }: { season: number; week: number; weeks: number[]; className?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const admin = isAdmin(user?.uid) && season === 2026;
  const selectable = (value: number) => weeks.includes(value) || (admin && value >= 1 && value <= 18);
  const options = [...new Set([...Array.from({ length: 18 }, (_, index) => index + 1), ...weeks, week])].sort((a, b) => a - b);

  return <label className={`flex h-[46px] items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-3 text-sm hover:bg-[var(--surface-hover)] ${className}`}>
    <select
      aria-label="NFL week"
      value={week}
      className="h-full w-40 cursor-pointer rounded-lg bg-transparent pr-2 pl-1 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      onChange={event => {
        const selected = Number(event.target.value);
        if (selected !== week && selectable(selected)) router.push(`/odds/nfl/${season}/week-${selected}`);
      }}
    >
      {options.map(value => <option key={value} value={value} disabled={!selectable(value)} className="bg-[var(--background)] text-[var(--foreground)]">
        Week {value}{!weeks.includes(value) ? admin ? " — Not synced yet" : " — Not available yet" : ""}
      </option>)}
    </select>
  </label>;
}
