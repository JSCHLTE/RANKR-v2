import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RankingPreview from "@/components/home/RankingPreview";
import styles from "@/components/home/home.module.css";

export const metadata: Metadata = {
  title: "RANKR — Your rankings. Your way.",
  description: "Build fantasy football rankings your way. Add or remove players, set your own order, explore injury updates, and customize your league format with RANKR.",
};

export default function Home() {
  return <main className={styles.home}>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span className={styles.statusDot} /> FANTASY FOOTBALL. PERSONALIZED.</p>
        <h1 id="hero-title">Your rankings.<br /><span>Your way.</span></h1>
        <p className={styles.heroDescription}>You have your favorites. Your sleepers. Your gut calls. Build a fantasy football ranking that actually reflects them.</p>
        <div className={styles.actions}><Link href="/create" className={styles.primary}>Build your rankings <span aria-hidden="true">→</span></Link><Link href="/rankings" className={styles.secondary}>Explore rankings <span aria-hidden="true">→</span></Link></div>
        <div className={styles.heroNote}><span aria-hidden="true">✓</span> Your players. Your order. Your league format.</div>
      </div>
      <div className={styles.heroVisual}><div className={styles.boardCaption}><span className={styles.captionLine} /> A LITTLE LESS CONSENSUS. A LITTLE MORE YOU.</div><RankingPreview /><div className={styles.visualCaption}><span aria-hidden="true">→</span> Big on a sleeper? Move them up. It’s your board.</div></div>
    </section>

    <div className={styles.featureStrip} aria-label="Ranking features"><span>Built for your league</span><span>Player injury updates</span><span>Add. Remove. Reorder.</span><span>Public or private</span></div>

    <section className={styles.features} aria-labelledby="features-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>YOU MAKE THE CALL</p><h2 id="features-title">Every pick has a reason.<br />Make room for yours.</h2></div><p>From the first name on your board to the last sleeper on your list, stay in control of the details.</p></div>
      <div className={styles.featureGrid}>
        <article className={`${styles.featureCard} ${styles.controlCard}`}>
          <div className={styles.cardIcon} aria-hidden="true">↕</div><h3>A board that bends to you.</h3><p>Add any available player, remove the ones you’re passing on, and reorder your list as your thinking changes.</p>
          <div className={styles.controlVisual} aria-hidden="true"><div><span className={styles.smallRank}>01</span><span>Your must-have pick</span><span className={styles.pill}>Move up</span></div><div><span className={styles.smallRank}>02</span><span>Your breakout bet</span><span className={styles.greenPlus}>+</span></div><div><span className={styles.smallRank}>03</span><span>Your late-round sleeper</span><span className={styles.greenPlus}>+</span></div></div>
        </article>
        <article className={styles.featureCard}>
          <div className={`${styles.cardIcon} ${styles.injuryIcon}`} aria-hidden="true">+</div><h3>Keep injuries in the picture.</h3><p>Check player injury updates, expected returns, and available notes right alongside your rankings. Keep the context close when you make a call.</p>
          <div className={styles.injuryVisual}><div><span className={styles.amberDot} />Injury insights<span className={styles.example}>FEATURE PREVIEW</span></div><p>More context. Better-informed picks.</p><div className={styles.injuryFields}><span>Severity</span><span>Expected return</span><span>Reinjury risk</span></div></div>
        </article>
        <article className={styles.featureCard}>
          <div className={styles.cardIcon} aria-hidden="true">≋</div><h3>Your league sets the context.</h3><p>Set your scoring, league size, and roster format so your rankings tell the whole story.</p><div className={styles.formatVisual} aria-label="Example league format"><span>PPR</span><span>12 Teams</span><span>QB <b>1</b></span><span>RB <b>2</b></span><span>WR <b>2</b></span><span>FLEX <b>1</b></span></div>
        </article>
        <article className={styles.featureCard}>
          <div className={styles.cardIcon} aria-hidden="true">◎</div><h3>Share your take. Or keep it close.</h3><p>Publish a ranking for others to explore, or keep your draft-day thinking private. You decide who sees your board.</p><div className={styles.visibilityVisual}><span><i /> Public ranking</span><span>Private ranking</span></div>
        </article>
      </div>
    </section>

    <section className={styles.stepsSection} aria-labelledby="steps-title"><div><p className={styles.eyebrow}>FROM GUT FEELING TO GAME PLAN</p><h2 id="steps-title">Make it yours.<br />Then keep making it better.</h2></div><ol className={styles.steps}>{[
      ["Set the stage", "Name your ranking and choose the league settings that give it context."],
      ["Build your board", "Add your players, adjust the order, and put your own thinking first."],
      ["Stay ready", "Check injury details and revisit your picks as your perspective changes."],
    ].map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section>

    <section className={styles.finalCta} aria-labelledby="cta-title"><div className={styles.ctaOrb} aria-hidden="true" /><p className={styles.eyebrow}>TRUST YOUR TAKE</p><h2 id="cta-title">The next great ranking<br />has your name on it.</h2><p>Give your fantasy football opinions a place to live.</p><Link href="/create" className={styles.primary}>Create your ranking <span aria-hidden="true">→</span></Link></section>
    <footer className={styles.footer}><Link href="/" aria-label="RANKR home"><Image src="/lion-green-long.svg" width={106} height={32} alt="RANKR" /></Link><span>Your rankings. Your way.</span><Link href="/rankings">Explore rankings</Link></footer>
  </main>;
}

