"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./login-form.module.css";

type FormState = {
  email: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    showPassword: false,
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(form.email.trim(), form.password);
      setIsSuccess(true);
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 650);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to log in.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={`${styles.page} ${isSuccess ? styles.pageSuccess : ""}`}>
      <div className={`${styles.background} ${isSuccess ? styles.backgroundSuccess : ""}`} aria-hidden="true" />

      <section className={styles.shell}>
        <div className={`${styles.logoRing} ${isSuccess ? styles.logoSuccess : ""}`} aria-hidden="true" />
        <div className={`${styles.logoInner} ${isSuccess ? styles.logoSuccess : ""}`} aria-hidden="true">
          <Image
            src="/logos/logo.png"
            alt="BayaniHub logo"
            width={64}
            height={64}
            className={styles.logoImage}
            priority
          />
        </div>

        <div className={`${styles.card} ${isSuccess ? styles.cardSuccess : ""}`}>
          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
          <header className={styles.header}>
            <p className={styles.welcome}>Welcome to</p>
            <h1 className={styles.brand}>BayaniHub</h1>
            <p className={styles.title}>LOGIN</p>
          </header>

          {serverError ? (
            <div className={`${styles.alert} ${styles.alertError}`} role="alert">
              {serverError}
            </div>
          ) : null}

          {isSuccess ? (
            <div className={styles.successState} role="status" aria-live="polite">
              <span className={styles.successCheck} aria-hidden="true">
                ✓
              </span>
              <p className={styles.successTitle}>Login successful</p>
              <p className={styles.successSubtitle}>Redirecting to homepage...</p>
            </div>
          ) : null}

          <form className={`${styles.form} ${isSuccess ? styles.formSuccess : ""}`} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <input
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                type="email"
                placeholder="Email"
                value={form.email}
                disabled={isLoading || isSuccess}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  if (errors.email) {
                    setErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                autoComplete="email"
              />
              {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
            </div>

            <div className={styles.field}>
              <div className={`${styles.passwordBox} ${errors.password ? styles.inputError : ""}`}>
                <div className={styles.inputIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  className={styles.passwordInput}
                  type={form.showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  disabled={isLoading || isSuccess}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, password: event.target.value }));
                    if (errors.password) {
                      setErrors((current) => ({ ...current, password: undefined }));
                    }
                  }}
                  autoComplete="current-password"
                />
                <button
                  className={styles.toggle}
                  type="button"
                  disabled={isLoading || isSuccess}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      showPassword: !current.showPassword,
                    }))
                  }
                >
                  {form.showPassword ? (
                    <svg key="hide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg key="show" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password ? <span className={styles.error}>{errors.password}</span> : null}
            </div>

            <div className={styles.rememberRow}>
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={form.rememberMe}
                  disabled={isLoading || isSuccess}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, rememberMe: event.target.checked }))
                  }
                />
                <span className={styles.rememberLabel}>Remember me</span>
              </label>
              <Link className={`${styles.forgot} ${isLoading || isSuccess ? styles.linkDisabled : ""}`} href="/forgot-password" aria-disabled={isLoading || isSuccess}>
                Forgot Password?
              </Link>
            </div>

            <button className={styles.submit} type="submit" disabled={isLoading || isSuccess}>
              {isSuccess ? "Success" : isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className={styles.divider}>OR</div>

          <div className={styles.socialRow}>
            <button className={styles.googleButton} type="button">
              <Image src="/icons/google.png" alt="Google" width={20} height={20} />
              <span>Continue with Google</span>
            </button>
          </div>

          <p className={styles.footer}>
            Don&apos;t have an account? <Link className={isLoading || isSuccess ? styles.linkDisabled : ""} href="/signup" aria-disabled={isLoading || isSuccess}>Sign Up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
