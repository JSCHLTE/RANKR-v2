"use client";

import { useState } from "react";
import styles from "./home.module.css";

const players = [
  { name: "Ja’Marr Chase", position: "WR", initials: "JC" },
  { name: "Bijan Robinson", position: "RB", initials: "BR" },
  { name: "Justin Jefferson", position: "WR", initials: "JJ" },
  { name: "Jahmyr Gibbs", position: "RB", initials: "JG" },
  { name: "CeeDee Lamb", position: "WR", initials: "CL" },
];

export default function RankingPreview() {
  const [roster, setRoster] = useState(players.slice(0, 4));
  const [message, setMessage] = useState("Try moving a player up or making room for someone new.");
  const nextPlayer = players.find(player => !roster.includes(player));

  function moveUp(index: number) {
    setRoster(current => {
      const next = [...current];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setMessage(`${roster[index].name} moved to number ${index}.`);
  }

  return <div className={styles.preview}>
    <div className={styles.previewHeader}>
      <div><span className={styles.eyebrow}>THE BOARD IS YOURS</span><h2>My draft-day favorites</h2></div>
      <span className={styles.demoBadge}>Try it out</span>
    </div>
    <div className={styles.tags}><span>12 Teams</span><span>PPR</span><span>My order. My call.</span></div>
    <div className={styles.listHeading}><span>RANK / PLAYER</span><span>MAKE YOUR MOVE</span></div>
    <ol className={styles.playerList}>
      {roster.map((player, index) => <li key={player.name} className={styles.playerRow}>
        <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
        <span className={`${styles.avatar} ${player.position === "RB" ? styles.runningBack : ""}`} aria-hidden="true">{player.initials}</span>
        <div className={styles.playerName}><strong>{player.name}</strong><span>{player.position}</span></div>
        <div className={styles.rowActions}>
          <button type="button" disabled={index === 0} onClick={() => moveUp(index)} aria-label={`Move ${player.name} up`} title="Move up">↑</button>
          <button type="button" onClick={() => { setRoster(current => current.filter(item => item !== player)); setMessage(`${player.name} removed from the example ranking.`); }} aria-label={`Remove ${player.name}`} title="Remove player">×</button>
        </div>
      </li>)}
    </ol>
    {roster.length === 0 && <p className={styles.empty}>A fresh board. Add a player to get started.</p>}
    <button type="button" className={styles.addPlayer} disabled={!nextPlayer} onClick={() => { if (nextPlayer) { setRoster(current => [...current, nextPlayer]); setMessage(`${nextPlayer.name} added to the example ranking.`); } }}><span aria-hidden="true">+</span>{nextPlayer ? `Add ${nextPlayer.name}` : "All example players added"}</button>
    <div className={styles.previewFoot}><span className={styles.statusDot} />Interactive preview · changes aren’t saved<button type="button" onClick={() => { setRoster(players.slice(0, 4)); setMessage("Example ranking reset."); }}>Reset</button></div>
    <p className={styles.srOnly} role="status">{message}</p>
  </div>;
}
