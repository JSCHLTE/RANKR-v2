"use client";
import { useState } from "react";
import Image from "next/image";
import type { PlayerProp } from "@/types/odds";
import { SPORTSBOOK_IDS, SPORTSBOOKS } from "@/lib/odds/sportsbooks";
import { consensusTotal } from "@/lib/odds/consensus";
import { ConsensusBadge, useOddsPreferences } from "./OddsPreferences";
import { formatOdds } from "./OddsValue";
function PropTeam({ team }: { team: string }) {
  const [failedTeam, setFailedTeam] = useState<string>();
  return <span className="inline-flex items-center align-middle" role="img" aria-label={team} title={team}>
    {failedTeam !== team && <Image unoptimized src={`https://sleepercdn.com/images/team_logos/nfl/${team.toLowerCase()}.png`} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" onError={() => setFailedTeam(team)} />}
  </span>;
}
function PlayerHeadshot({ sleeperId }: { sleeperId?: string }) {
  const [failedId, setFailedId] = useState<string>();
  return <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-hover)]">
    {sleeperId && /^\d+$/.test(sleeperId) && failedId !== sleeperId
      // Match the rankings CDN images; fixed dimensions prevent layout shifts.
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={`https://sleepercdn.com/content/nfl/players/${sleeperId}.jpg`} alt="" width={44} height={44} loading="lazy" className="h-full w-full object-cover" onError={() => setFailedId(sleeperId)} />
      : <svg viewBox="0 0 24 24" className="h-7 w-7 text-[var(--text-muted)]" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3z" /></svg>}
  </span>;
}
function MarketRow({ prop }: { prop: PlayerProp }) {
  const { preferences } = useOddsPreferences();
  const market = preferences.mode === "consensus" ? consensusTotal(prop.sportsbooks, preferences.includedBooks) : prop.sportsbooks[preferences.sportsbook];
  return <div className="border-t border-[var(--border)] py-3">
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2">
      <h4 className="pr-1 text-sm font-medium">{prop.displayName}</h4>
      {(["over", "under"] as const).map(side => {
        const odds = side === "over" ? market?.overOdds : market?.underOdds;
        const available = market?.line != null && odds != null;
        return <div key={side} aria-label={`${side === "over" ? "Over" : "Under"}: ${available ? `${market.line}, ${formatOdds(odds)}` : "unavailable"}`} className={`rounded-lg border border-[var(--border)] px-2 py-1.5 tabular-nums ${available ? "bg-[var(--surface-hover)]" : "text-[var(--text-muted)]"}`}>
          <p className="whitespace-nowrap text-sm font-semibold">{side === "over" ? "O" : "U"} {market?.line ?? "—"}</p>
          <p className="mt-0.5 text-xs">{available ? formatOdds(odds) : "—"}</p>
        </div>;
      })}
    </div>
    <details><summary className="cursor-pointer text-xs text-[var(--accent)]">Compare all sportsbooks</summary><div className="mt-3 overflow-x-auto" role="region" aria-label={`${prop.playerName} ${prop.displayName} comparison`} tabIndex={0}><table className="w-full min-w-[300px] text-left text-xs"><thead><tr>{["Book", "Line", "Over", "Under"].map(label => <th scope="col" key={label} className="py-2">{label}</th>)}</tr></thead><tbody>{SPORTSBOOK_IDS.map(book => <tr key={book} className="border-t border-[var(--border)]"><th scope="row" className="py-2 font-normal">{SPORTSBOOKS[book].name}</th><td>{prop.sportsbooks[book]?.line ?? "—"}</td><td>{formatOdds(prop.sportsbooks[book]?.overOdds)}</td><td>{formatOdds(prop.sportsbooks[book]?.underOdds)}</td></tr>)}</tbody></table></div></details>
  </div>;
}
export function PlayerProps({ props }: { props: PlayerProp[] }) {
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [search, setSearch] = useState("");
  const markets = new Map(props.map(prop => [prop.market, prop.displayName]));
  const activeMarket = markets.has(selectedMarket) ? selectedMarket : "all";
  const query = search.trim().toLowerCase();
  const players = new Map<string, PlayerProp[]>();
  for (const prop of props) {
    if (activeMarket !== "all" && prop.market !== activeMarket) continue;
    if (query && !`${prop.playerName} ${prop.displayName}`.toLowerCase().includes(query)) continue;
    const group = players.get(prop.playerId) ?? [];
    group.push(prop);
    players.set(prop.playerId, group);
  }
  return <section><h2 className="mb-4 text-xl font-semibold">Player props</h2>
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 focus-within:ring-2 focus-within:ring-[var(--accent)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-[var(--text-muted)]"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
        <span className="sr-only">Search players or markets</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search players or markets" className="min-w-0 w-full bg-transparent py-2.5 text-sm outline-none" />
      </label>
      <label><span className="sr-only">Player prop market</span><select value={activeMarket} onChange={event => setSelectedMarket(event.target.value)} className="w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus-visible:outline-[var(--accent)] sm:w-48">
        <option className="bg-[var(--background)] text-[var(--foreground)]" value="all">All markets</option>{[...markets].sort((a, b) => a[1].localeCompare(b[1])).map(([market, label]) => <option className="bg-[var(--background)] text-[var(--foreground)]" key={market} value={market}>{label}</option>)}
      </select></label>
    </div>
    {players.size ? <div className="grid items-start gap-4 md:grid-cols-2">{[...players].map(([playerId, markets]) => {
      const player = markets[0];
      return <article key={playerId} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-3"><PlayerHeadshot sleeperId={player.sleeperId} /><div className="min-w-0"><h3 className="font-semibold">{player.playerName} <PropTeam team={player.team} /></h3><p className="mt-1 text-xs text-[var(--text-muted)]">{markets.length} {markets.length === 1 ? "market" : "markets"}</p></div></div><ConsensusBadge /></div>
        {markets.map(prop => <MarketRow key={prop.market} prop={prop} />)}
      </article>;
    })}</div> : <p role="status" className="rounded-2xl bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">{props.length ? "No player props match your search and market selection." : "No player props available for this game."}</p>}
  </section>;
}
