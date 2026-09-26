import type { ReactNode } from "react";
import { updatedTime } from "./OddsValue";
import styles from "./oddsOverview.module.css";

export function OddsPageHeader({ title, season, week, updatedAt, isMock }: { title: ReactNode; season: number; week: number; updatedAt: string; isMock: boolean }) {
  return <header className={styles.hero}>
    <div className={styles.heroArt} aria-hidden="true" />
    <div className={styles.heroContent}>
      <p className={styles.eyebrow}>NFL ODDS <span>· {season} · WEEK {week}</span></p>
      <h1 className={styles.heroTitle}>NFL <span>{title}</span></h1>
      <p className={styles.heroDescription}>Live NFL betting odds, updated regularly.</p>
      <p className={styles.updated}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{isMock ? "Mock data · Illustrative matchups, dates and prices · " : ""}{updatedAt ? `Last updated ${updatedTime(updatedAt)}` : "No odds published yet"}</p>
    </div>
  </header>;
}
