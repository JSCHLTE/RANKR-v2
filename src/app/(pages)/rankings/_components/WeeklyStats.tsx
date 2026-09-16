"use client";

import { useEffect, useRef, useState } from "react";
import { formatStat, statGrade } from "@/lib/player-yearly-stats";
import { defaultWeeklySeason, parseWeeklyStats, weeklyColumns, weeklySeasons, weeklyStat, type PlayerWeeklyStats } from "@/lib/player-weekly-stats";
import styles from "./PlayerProfile.module.css";

// Weekly files are larger than yearly files; bound the session cache to recent profiles.
const cache = new Map<string, PlayerWeeklyStats>();
const grades = ["Very poor", "Poor", "Average", "Good", "Excellent"];

export default function WeeklyStats({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerWeeklyStats | null>(cache.get(playerId) ?? null);
  const [status, setStatus] = useState("loading");
  const [selectedYear, setSelectedYear] = useState<number>();
  const [attempt, setAttempt] = useState(0);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const cached = cache.get(playerId);
      if (cached) { setData(cached); setStatus("ready"); return; }
      setStatus("loading");
      try {
        const response = await fetch(`/data/player-stats/weekly/${encodeURIComponent(playerId)}.json`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 404) { setStatus("missing"); return; }
        if (!response.ok) throw new Error("Request failed");
        const parsed = parseWeeklyStats(await response.json(), playerId);
        if (controller.signal.aborted) return;
        cache.set(playerId, parsed);
        if (cache.size > 20) cache.delete(cache.keys().next().value!);
        setData(parsed); setStatus("ready");
      } catch { if (!controller.signal.aborted) setStatus("error"); }
    }
    void load();
    return () => controller.abort();
  }, [playerId, attempt]);

  const year = selectedYear ?? (data ? defaultWeeklySeason(data) : undefined);
  const columns = data && year !== undefined ? weeklyColumns(data, year) : [];
  const rows = data?.playerStats.filter(row => row.year === year).sort((a, b) => a.week - b.week) ?? [];
  const groups: { name: string; count: number }[] = [];
  for (const column of columns) {
    const last = groups.at(-1);
    if (last?.name === column.group) last.count++;
    else groups.push({ name: column.group, count: 1 });
  }
  return <section className={styles.section} aria-labelledby="weekly-heading">
    <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>WEEK BY WEEK</p><h3 id="weekly-heading">Player logs</h3></div>
      {data && <div className={`${styles.tabs} ${styles.seasonTabs}`} aria-label="Weekly log season">{weeklySeasons(data).map(season => <button key={season} type="button" aria-pressed={year === season} onClick={() => { setSelectedYear(season); scroll.current?.scrollTo({ left: 0 }); }}>{season}</button>)}</div>}
    </div>
    {status === "loading" && !data && <div role="status" className={styles.empty}>Loading weekly logs…<div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></div>}
    {(status === "missing" || (status === "ready" && !rows.length)) && <div role="status" className={styles.empty}>Weekly logs aren’t available for this player yet.</div>}
    {status === "error" && <div role="alert" className={styles.empty}>Weekly logs couldn’t be loaded.<button type="button" className={styles.retry} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    {rows.length > 0 && <>
      <div className={styles.tableHint}><span>Season {year} · PPR scoring</span><div className={styles.scrollControls}><span>Scroll to explore →</span><button type="button" aria-label="Scroll weekly stats left" onClick={() => scroll.current?.scrollBy({ left: -(scroll.current.clientWidth * .75), behavior: "smooth" })}>←</button><button type="button" aria-label="Scroll weekly stats right" onClick={() => scroll.current?.scrollBy({ left: scroll.current.clientWidth * .75, behavior: "smooth" })}>→</button></div></div>
      <div ref={scroll} className={styles.tableScroll} tabIndex={0} role="region" aria-label={`Weekly statistics for ${year}, horizontally scrollable`}>
        <table className={styles.table}><caption className="sr-only">Weekly player logs for {year}, ordered by week</caption><thead>
          <tr><th scope="colgroup" colSpan={2}>Game</th>{groups.map(group => <th key={group.name} scope="colgroup" colSpan={group.count}>{group.name}</th>)}</tr>
          <tr><th scope="col" className={styles.sticky}>Week · Opponent</th><th scope="col">Team</th>{columns.map(column => <th key={`${column.context}-${column.id}`} scope="col"><abbr title={rows.flatMap(row => row.stats).find(stat => stat.serial_id === column.id && stat.stat_context === column.context)?.description || column.id}>{column.label}</abbr></th>)}</tr>
        </thead><tbody>{rows.map((row, index) => <tr key={`${row.week}-${index}`}>
          <th scope="row" className={styles.sticky}>{row.week}. {row.opponent}{row.upcoming && <span className={styles.scheduled}>Scheduled</span>}</th><td>{row.team?.abbr || "—"}</td>
          {columns.map(column => { const stat = weeklyStat(row, column); const grade = statGrade(stat); return <td key={`${column.context}-${column.id}`} data-grade={grade} title={`${stat?.description || column.label}${grade === undefined ? "" : ` · ${grades[grade]}`}`}>{formatStat(stat)}</td>; })}
        </tr>)}</tbody></table>
      </div><p className={styles.footnote}>— = unavailable · Scheduled games have no recorded stats. Colors reflect the supplied performance ranges.</p>
    </>}
  </section>;
}
