"use client";
export default function OddsError({ reset }: { reset: () => void }) {
  return <section className="py-12"><h1 className="text-2xl font-semibold">Odds are temporarily unavailable</h1><p className="mt-3 text-[var(--text-muted)]">We couldn’t load the odds data.</p><button type="button" onClick={reset} className="mt-5 cursor-pointer rounded-lg bg-[var(--surface)] px-4 py-2 text-[var(--accent)]">Try again</button></section>;
}
