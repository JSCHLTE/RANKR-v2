export default function OddsLoading() {
  return <div role="status" className="space-y-4"><p className="text-sm text-[var(--text-muted)]">Loading odds…</p>{[0, 1, 2].map(value => <div key={value} className="h-40 animate-pulse rounded-2xl bg-[var(--surface)]" />)}</div>;
}
