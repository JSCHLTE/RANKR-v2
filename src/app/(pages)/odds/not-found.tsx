import Link from "next/link";
export default function OddsNotFound() {
  return <section className="py-16 text-center"><h1 className="text-2xl font-semibold">Odds not found</h1><p className="mt-3 text-[var(--text-muted)]">This week or game has no published odds yet.</p><Link href="/odds" className="mt-6 inline-block text-[var(--accent)]">View available NFL odds →</Link></section>;
}
