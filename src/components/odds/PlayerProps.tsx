"use client";
import { useState } from "react";
import type { PlayerProp } from "@/types/odds";
import { PROP_CATEGORIES, SPORTSBOOK_IDS, SPORTSBOOKS } from "@/lib/odds/sportsbooks";
import { consensusTotal } from "@/lib/odds/consensus";
import { ConsensusBadge, useOddsPreferences } from "./OddsPreferences";
import { formatOdds } from "./OddsValue";
export function PlayerPropCard({ prop }: { prop: PlayerProp }) {
  const { preferences } = useOddsPreferences();
  const market = preferences.mode === "consensus" ? consensusTotal(prop.sportsbooks, preferences.includedBooks) : prop.sportsbooks[preferences.sportsbook];
  return <article className="rounded-2xl bg-[var(--surface)] p-5">
    <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{prop.playerName} <span className="text-xs text-[var(--text-muted)]">{prop.team}</span></h3><p className="mt-1 text-sm text-[var(--text-muted)]">{prop.displayName}</p></div><ConsensusBadge /></div>
    {market?.line == null ? <p className="my-5 text-sm text-[var(--text-muted)]">Player prop unavailable for this selection.</p> : <div className="my-5 grid grid-cols-3 gap-3 tabular-nums"><div><p className="text-xs text-[var(--text-muted)]">Line</p><p className="mt-1 text-xl font-semibold">{market.line}</p></div><div><p className="text-xs text-[var(--text-muted)]">Over</p><p className="mt-1 text-xl">{formatOdds(market.overOdds)}</p></div><div><p className="text-xs text-[var(--text-muted)]">Under</p><p className="mt-1 text-xl">{formatOdds(market.underOdds)}</p></div></div>}
    <details><summary className="cursor-pointer text-xs text-[var(--accent)]">Compare all sportsbooks</summary><div className="mt-3 overflow-x-auto" role="region" aria-label={`${prop.playerName} ${prop.displayName} comparison`} tabIndex={0}><table className="w-full min-w-[300px] text-left text-xs"><thead><tr>{["Book", "Line", "Over", "Under"].map(label => <th scope="col" key={label} className="py-2">{label}</th>)}</tr></thead><tbody>{SPORTSBOOK_IDS.map(book => <tr key={book} className="border-t border-[var(--border)]"><th scope="row" className="py-2 font-normal">{SPORTSBOOKS[book].name}</th><td>{prop.sportsbooks[book]?.line ?? "—"}</td><td>{formatOdds(prop.sportsbooks[book]?.overOdds)}</td><td>{formatOdds(prop.sportsbooks[book]?.underOdds)}</td></tr>)}</tbody></table></div></details>
  </article>;
}
export function PlayerProps({ props }: { props: PlayerProp[] }) {
  const [category, setCategory] = useState("all");
  const categories: Record<string, string> = { all: "All", ...PROP_CATEGORIES };
  for (const prop of props) if (!categories[prop.category]) categories[prop.category] = prop.category;
  const visible = props.filter(prop => category === "all" || prop.category === category);
  return <section><h2 className="mb-4 text-xl font-semibold">Player props</h2><div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Player prop category">{Object.entries(categories).map(([key, label]) => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)} className={`cursor-pointer rounded-full px-4 py-2 text-sm ${category === key ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>{label}</button>)}</div>
    {visible.length ? <div className="grid gap-4 md:grid-cols-2">{visible.map(prop => <PlayerPropCard key={`${prop.playerId}-${prop.market}`} prop={prop} />)}</div> : <p className="rounded-2xl bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">No player props available in this category.</p>}
  </section>;
}
