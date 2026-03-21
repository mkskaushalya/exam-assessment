import Link from 'next/link';

import styles from './page.module.scss';

export default function HomePage() {
  return (
    <main className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Master Your Exams with
          <span className={styles.highlight}> Confidence</span>
        </h1>
        <p className={styles.subtitle}>
          Practice with past papers, model papers, and AI-predicted questions.
          Track your progress and identify areas for improvement.
        </p>
        <div className={styles.actions}>
          <Link href="/papers" className={styles.primaryBtn}>
            Browse Papers
          </Link>
          <Link href="/register" className={styles.secondaryBtn}>
            Get Started
          </Link>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>500+</span>
            <span className={styles.statLabel}>Practice Papers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>10K+</span>
            <span className={styles.statLabel}>Questions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>95%</span>
            <span className={styles.statLabel}>Pass Rate</span>
          </div>
        </div>
      </div>
    </main>
  );
}
