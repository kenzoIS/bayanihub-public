import styles from "./auth-shell.module.css";

export function SocialRow() {
  return (
    <>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>OR</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.socialRow} role="group" aria-label="Social login options">
        <button className={styles.socialButton} type="button" aria-label="Continue with Google">
          <span style={{ color: "#ea4335" }}>G</span>
        </button>
        <button className={styles.socialButton} type="button" aria-label="Continue with Apple">
          <span>O</span>
        </button>
        <button className={styles.socialButton} type="button" aria-label="Continue with Facebook">
          <span style={{ color: "#4285f4" }}>f</span>
        </button>
      </div>
    </>
  );
}
