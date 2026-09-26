"use client";

import { hasActiveRankrPass, type RankrPass } from "@/lib/rankr-pass";
import Link from "next/link";
import type { GameSummary } from "@/types/odds";
import { selectGameMarkets } from "@/lib/odds/consensus";
import { ConsensusBadge, useOddsPreferences } from "./OddsPreferences";
import { formatOdds, gameTime } from "./OddsValue";
import { TeamMatchup } from "./TeamMatchup";
import styles from "./oddsOverview.module.css";

function coloredValue(value: number | null | undefined) {
  return value == null ? styles.neutral : value < 0 ? styles.negative : styles.positive;
}

function SpreadRow({ team, line, odds }: { team: string; line?: number | null; odds?: number | null }) {
  return <div className={styles.priceRow}><span className={`${styles.mainPrice} ${coloredValue(line)}`}>{team} {formatOdds(line)}</span><span className={styles.priceOdds}>({formatOdds(odds)})</span></div>;
}

function MoneylineRow({ team, odds }: { team: string; odds?: number | null }) {
  return <div className={styles.priceRow}><span className={`${styles.mainPrice} ${coloredValue(odds)}`}>{team} {formatOdds(odds)}</span></div>;
}

export function GameOddsCard({ game, season, week, pass }: { game: GameSummary; season: number; week: number; pass?: RankrPass }) {
  const { preferences } = useOddsPreferences();
  const markets = selectGameMarkets(game.sportsbooks, preferences);
  return <Link href={hasActiveRankrPass(pass) ? `/odds/nfl/${season}/week-${week}/${game.slug}` : "/subscribe"} className={styles.card}>
    <div className={styles.cardTop}><time dateTime={game.startTime}>{gameTime(game.startTime)}</time><span className={styles.badge}><ConsensusBadge /></span></div>
    <div className={styles.cardBody}>
      <div className={styles.matchup}><TeamMatchup away={game.away} home={game.home} /><h2>{game.away.name}<br />at {game.home.name}</h2></div>
      <div className={styles.markets}>
        <div className={styles.market}><p className={styles.marketLabel}>Spread</p><div className={styles.marketRows}><SpreadRow team={game.away.abbr} line={markets.spread?.awayLine} odds={markets.spread?.awayOdds} /><SpreadRow team={game.home.abbr} line={markets.spread?.homeLine} odds={markets.spread?.homeOdds} /></div></div>
        <div className={styles.market}><p className={styles.marketLabel}>Total</p><div className={styles.marketRows}><div className={styles.priceRow}><span className={styles.mainPrice}>O {markets.total?.line ?? "—"}</span><span className={styles.priceOdds}>({formatOdds(markets.total?.overOdds)})</span></div><div className={styles.priceRow}><span className={styles.mainPrice}>U {markets.total?.line ?? "—"}</span><span className={styles.priceOdds}>({formatOdds(markets.total?.underOdds)})</span></div></div></div>
        <div className={styles.market}><p className={styles.marketLabel}>Moneyline</p><div className={styles.marketRows}><MoneylineRow team={game.away.abbr} odds={markets.moneyline?.awayOdds} /><MoneylineRow team={game.home.abbr} odds={markets.moneyline?.homeOdds} /></div></div>
      </div>
    </div>
    <p className={styles.cardLink}>Compare lines &amp; player props <span aria-hidden="true">→</span></p>
  </Link>;
}
