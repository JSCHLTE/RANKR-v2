import { PlayerLite } from "@/types/player";

export function injuryColor(severity: string | null | undefined) {
  return severity === "low" ? "text-green-400" : severity === "medium" ? "text-yellow-400" : severity === "high" ? "text-red-400" : "text-[var(--text-muted)]";
}

export default function InjuryInfo({ player }: { player: PlayerLite }) {
  return <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] shadow-xl">
    <div className="flex gap-3 p-4">
      <span aria-hidden="true" className={`mt-0.5 h-6 w-6 shrink-0 bg-current ${injuryColor(player.injurySeverity)}`} style={{ mask: "url('/injury.svg') center / contain no-repeat", WebkitMask: "url('/injury.svg') center / contain no-repeat" }} />
      <div>
        <h3 className="font-semibold">{player.injuryName?.trim() || "Injury update"}</h3>
        <p className={`mt-1 text-xs font-semibold uppercase ${injuryColor(player.injurySeverity)}`}>{player.injurySeverity ? `${player.injurySeverity} concern` : "Severity unknown"}</p>
      </div>
    </div>
    <dl className="space-y-2 border-t border-[var(--border)] p-4">
      <div className="flex justify-between gap-4"><dt className="text-xs uppercase text-[var(--text-muted)]">Expected return</dt><dd className="text-right font-medium">{player.injuryExpectedReturn?.trim() || "Unknown"}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-xs uppercase text-[var(--text-muted)]">Reinjury risk</dt><dd className={`text-right font-medium ${injuryColor(player.injuryReinjuryRisk?.toLowerCase())}`}>{player.injuryReinjuryRisk?.trim() || "Unknown"}</dd></div>
    </dl>
    <div className="border-t border-[var(--border)] p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-[var(--text-muted)]">Notes</p>
      <p className="whitespace-pre-wrap break-words leading-relaxed">{player.injuryNote?.trim() || "No notes available."}</p>
    </div>
  </div>;
}
