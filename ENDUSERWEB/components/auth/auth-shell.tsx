import type { ReactNode } from "react";
import styles from "./auth-shell.module.css";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className={styles.page}>
      <div className={`${styles.blob} ${styles.blobTop}`} aria-hidden="true" />
      <div className={`${styles.blob} ${styles.blobBottom}`} aria-hidden="true" />

      <main className={styles.wrapper}>
        <div className={styles.cardFrame}>
          <div className={styles.logoRing} aria-hidden="true" />
          <div className={styles.logoBadge} aria-hidden="true">
            D
          </div>

          <section className={styles.card}>
            <header className={styles.header}>
              <p className={styles.welcome}>Welcome to</p>
              <h1 className={styles.brand}>BayaniHub</h1>
              <p className={styles.title}>{title}</p>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </header>

            {children}
            {footer ? <div className={styles.footer}>{footer}</div> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
