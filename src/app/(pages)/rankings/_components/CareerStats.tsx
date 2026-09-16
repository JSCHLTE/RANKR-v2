"use client";

import { useEffect, useState } from "react";
import { careerColumns, careerStat, formatStat, parseYearlyStats, statGrade, type CareerMode, type PlayerYearlyStats } from "@/lib/player-yearly-stats";
import styles from "./PlayerProfile.module.css";

const cache = new Map<string, PlayerYearlyStats>();
const grades = ["Very poor", "Poor", "Average", "Good", "Excellent"];

export default function CareerStats({ playerId }: { playerId: string }) {
  const [data, setData] = useState<PlayerYearlyStats | null>(cache.get(playerId) ?? null);
  const [status, setStatus] = useState("loading");
  const [mode, setMode] = useState<CareerMode>("Totals");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      if (cache.has(playerId)) { setData(cache.get(playerId)!); setStatus("ready"); return; }
      setStatus("loading");
      try {
        const response = await fetch(`/data/player-stats/yearly/${encodeURIComponent(playerId)}-yearly.json`, { signal: controller.signal });
        if (response.status === 404) { setStatus("missing"); return; }
        if (!response.ok) throw new Error("Request failed");
        const result = parseYearlyStats(await response.json(), playerId);
        if (controller.signal.aborted) return;
        cache.set(playerId, result); setData(result); setStatus("ready");
      } catch { if (!controller.signal.aborted) setStatus("error"); }
    }
    void load();
    return () => controller.abort();
  }, [playerId, attempt]);
  const columns = data ? careerColumns(data) : [];
  const groups: { name: string; count: number }[] = [];
  for (const column of columns) {
    const previous = groups.at(-1);
    if (previous?.name === column.group) previous.count++;
    else groups.push({ name: column.group, count: column.group === "Season" ? 3 : 1 });
  }
  return <section aria-labelledby="career-heading" className={styles.section}>
    <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>YEAR BY YEAR</p><h3 id="career-heading">Player career</h3></div>
      <div className={styles.tabs} aria-label="Career values">{(["Totals", "Averages"] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value}</button>)}</div>
    </div>
    {status === "loading" && !data && <div role="status" className={styles.empty}>Loading career statistics…<div className={styles.skeleton} /><div className={styles.skeleton} /><div className={styles.skeleton} /></div>}
    {(status === "missing" || (status === "ready" && !data?.allYearlyStats.length)) && <div role="status" className={styles.empty}>Career statistics aren’t available for this player yet.</div>}
    {status === "error" && <div role="alert" className={styles.empty}>Career statistics couldn’t be loaded.<button type="button" className={styles.retry} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
    {data && data.allYearlyStats.length > 0 && <>
      <div className={styles.tableHint}><span>{mode === "Totals" ? "Full-season totals" : "Per-game counts · season rates and shares"}</span><span>Scroll horizontally to explore →</span></div>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Career statistics, horizontally scrollable">
        <table className={styles.table}><caption className="sr-only">Career {mode.toLowerCase()}, newest season first</caption><thead>
          <tr>{groups.map(group => <th key={group.name} scope="colgroup" colSpan={group.count}>{group.name}</th>)}</tr>
          <tr><th scope="col" className={styles.sticky}>Season</th><th scope="col">Team</th>{columns.map(column => <th scope="col" key={column.id}><abbr title={data.allYearlyStats.flatMap(season => season.stats).find(stat => stat.serial_id === column.id)?.description || column.label}>{column.label}</abbr></th>)}</tr>
        </thead><tbody>{[...data.allYearlyStats].sort((a, b) => b.year - a.year).map((season, index) => <tr key={`${season.year}-${index}`}>
          <th scope="row" className={styles.sticky}>{season.year}</th><td>{season.team?.abbr || "—"}</td>
          {columns.map(column => { const stat = careerStat(season, column, mode); const grade = column.kind === "games" ? undefined : statGrade(stat); return <td key={column.id} data-grade={grade} title={`${stat?.description || column.label}${grade === undefined ? "" : ` · ${grades[grade]}`}`}>{formatStat(stat)}</td>; })}
        </tr>)}</tbody></table>
      </div><p className={styles.footnote}>PPR scoring · GP = games played · — = unavailable. Colors reflect the supplied performance ranges.</p>
    </>}
  </section>;
}
