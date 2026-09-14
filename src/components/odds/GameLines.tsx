"use client";
import type { BookMap, GameMarkets } from "@/types/odds";
import { selectGameMarkets } from "@/lib/odds/consensus";
import { SPORTSBOOK_IDS, SPORTSBOOKS } from "@/lib/odds/sportsbooks";
import { OddsValue, formatOdds } from "./OddsValue";
import { ConsensusBadge, useOddsPreferences } from "./OddsPreferences";

export function MarketSummary({ markets, away, home }: { markets: GameMarkets; away: string; home: string }) {
  return <div className="grid grid-cols-3 gap-3 text-sm">
    <div><p className="mb-2 text-xs text-[var(--text-muted)]">Spread</p><p>{away} <OddsValue line={markets.spread?.awayLine} odds={markets.spread?.awayOdds} /></p><p className="mt-2">{home} <OddsValue line={markets.spread?.homeLine} odds={markets.spread?.homeOdds} /></p></div>
    <div><p className="mb-2 text-xs text-[var(--text-muted)]">Total</p><p><OddsValue prefix="O " line={markets.total?.line} odds={markets.total?.overOdds} /></p><p className="mt-2"><OddsValue prefix="U " line={markets.total?.line} odds={markets.total?.underOdds} /></p></div>
    <div><p className="mb-2 text-xs text-[var(--text-muted)]">Moneyline</p><p>{away} {formatOdds(markets.moneyline?.awayOdds)}</p><p className="mt-2">{home} {formatOdds(markets.moneyline?.homeOdds)}</p></div>
  </div>;
}
export function GameLines({ books, away, home }: { books: BookMap<GameMarkets>; away: string; home: string }) {
  const { preferences } = useOddsPreferences();
  return <section className="mb-10"><h2 className="mb-4 text-xl font-semibold">Game lines</h2>
    <div className="mb-4 rounded-2xl bg-[var(--surface)] p-4"><div className="mb-3"><ConsensusBadge /></div><MarketSummary markets={selectGameMarkets(books, preferences)} away={away} home={home} /></div>
    <SportsbookComparisonTable books={books} away={away} home={home} />
  </section>;
}
export function SportsbookComparisonTable({ books, away, home }: { books: BookMap<GameMarkets>; away: string; home: string }) {
  return <div role="region" aria-label="Game lines by sportsbook" tabIndex={0} className="overflow-x-auto rounded-2xl bg-[var(--surface)]"><table className="w-full min-w-[780px] text-left text-sm">
    <caption className="p-4 text-left text-xs text-[var(--text-muted)]">All supported books · — indicates unavailable data</caption>
    <thead><tr>{["Sportsbook", `${away} spread`, `${home} spread`, "Over", "Under", `${away} ML`, `${home} ML`].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
    <tbody>{SPORTSBOOK_IDS.map(book => { const value = books[book]; return <tr key={book} className="border-t border-[var(--border)]">
      <th scope="row" className="px-4 py-3 font-medium">{SPORTSBOOKS[book].name}</th>
      <td className="p-3"><OddsValue line={value?.spread?.awayLine} odds={value?.spread?.awayOdds} /></td><td className="p-3"><OddsValue line={value?.spread?.homeLine} odds={value?.spread?.homeOdds} /></td>
      <td className="p-3"><OddsValue prefix="O " line={value?.total?.line} odds={value?.total?.overOdds} /></td><td className="p-3"><OddsValue prefix="U " line={value?.total?.line} odds={value?.total?.underOdds} /></td>
      <td className="p-3">{formatOdds(value?.moneyline?.awayOdds)}</td><td className="p-3">{formatOdds(value?.moneyline?.homeOdds)}</td>
    </tr>; })}</tbody>
  </table></div>;
}
