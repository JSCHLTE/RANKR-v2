export function formatOdds(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "—" : value > 0 ? `+${value}` : String(value);
}
export function OddsValue({ line, odds, prefix = "" }: { line?: number | null; odds?: number | null; prefix?: string }) {
  return <span className="whitespace-nowrap tabular-nums">{line == null ? "—" : `${prefix}${prefix ? line : formatOdds(line)}`} <span className="text-xs text-[var(--text-muted)]">({formatOdds(odds)})</span></span>;
}
export function gameTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date(value));
}
