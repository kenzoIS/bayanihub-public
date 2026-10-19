import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>© 2025 BayaniHub Admin Portal. All rights reserved.</p>
        <div className={styles.links}>
          <Link href="/help" className={styles.link}>Help Center</Link>
          <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
          <Link href="/terms" className={styles.link}>Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
