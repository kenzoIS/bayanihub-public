"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./signup-review-screen.module.css";

export function SignupReviewScreen() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true" />

      <section className={styles.shell}>
        <div className={styles.logoRing} aria-hidden="true" />
        <div className={styles.logoInner} aria-hidden="true">
          <Image
            src="/logos/logo.png"
            alt="BayaniHub logo"
            width={64}
            height={64}
            className={styles.logoImage}
            priority
          />
        </div>

        <div className={styles.card}>
          <Image
            src="/images/Review in progress.png"
            alt="Review in progress"
            width={470}
            height={268}
            className={styles.illustrationImage}
            priority
          />

          <h1 className={styles.headline}>
            Your profile
            <br />
            is under review
          </h1>

          <p className={styles.message}>
            Your profile has been submitted and will be reviewed by our team. You will be
            notified if any extra information is needed.
          </p>

          <button className={styles.action} type="button" onClick={() => router.push("/login")}>
            Back to Login
          </button>
        </div>
      </section>
    </main>
  );
}
