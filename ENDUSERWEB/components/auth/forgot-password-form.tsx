"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import styles from "./forgot-password-flow.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type Step = "request" | "otp" | "reset" | "success";

export function ForgotPasswordForm() {
  const router = useRouter();
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const joinedOtp = useMemo(() => otp.join(""), [otp]);

  const handleSendCode = async () => {
    setError(null);

    if (!identifier.trim()) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Something went wrong.");
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // OTP is mocked — any 6 digits pass
  const handleVerifyOtp = () => {
    setError(null);

    if (joinedOtp.length !== 6) {
      setError("Enter the full 6-digit OTP code.");
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = async () => {
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), newPassword }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to reset password.");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <main className={styles.page}>
        <div className={styles.background} aria-hidden="true" />
        <section className={`${styles.shell} ${styles.successShell}`}>
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

          <div className={`${styles.card} ${styles.successCard}`}>
            <h1 className={styles.title}>Password Reset</h1>
            <div className={styles.successIconWrap}>
              <Image
                src="/icons/password reset.png"
                alt="Password reset success"
                width={123}
                height={123}
                className={styles.successIconImage}
                priority
              />
            </div>
            <p className={styles.successMessage}>
              Your password has been changed!
              <br />
              Please login again.
            </p>
            <button className={styles.button} type="button" onClick={() => router.push("/login")}>
              Back to Log In
            </button>
          </div>
        </section>
      </main>
    );
  }

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
          <div className={styles.contentGrid}>
            <div className={styles.textColumn}>
              <div className={styles.formBlock}>
                <button
                  className={styles.backButton}
                  type="button"
                  aria-label="Go back"
                  onClick={() => {
                    if (step === "otp") {
                      setStep("request");
                      setError(null);
                      return;
                    }

                    if (step === "reset") {
                      setStep("otp");
                      setError(null);
                      return;
                    }

                    if (window.history.length > 1) {
                      router.back();
                    } else {
                      router.push("/login");
                    }
                  }}
                >
                  <Image
                    src="/icons/Arrow left.png"
                    alt="Back arrow"
                    width={22}
                    height={22}
                    className={styles.eyebrowIcon}
                    priority
                  />
                </button>

                {step === "request" ? (
                  <>
                    <h1 className={styles.title}>Forgot Password</h1>
                    <p className={styles.description}>
                      Don&apos;t worry, happens to all of us. Enter your email below to recover your
                      password
                    </p>

                    <div className={styles.field}>
                      <input
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="Email"
                        type="email"
                      />
                    </div>

                    {error ? <div className={styles.error}><span>{error}</span></div> : null}

                    <button className={styles.button} type="button" onClick={handleSendCode} disabled={isLoading}>
                      {isLoading ? "Sending…" : "Send Code"}
                    </button>

                    <div className={styles.socialWrap}>
                      <div className={styles.socialLabel}>or continue with</div>
                      <div className={styles.socialRow}>
                        <button className={styles.googleButton} type="button">
                          <Image src="/icons/google.png" alt="Google" width={20} height={20} />
                          <span>Continue with Google</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}

                {step === "otp" ? (
                  <>
                    <h1 className={styles.title}>Enter OTP Code</h1>
                    <p className={`${styles.description} ${styles.compactDescription}`}>
                      <span>We&apos;ve sent a 6-digit code to your provided </span><span className={styles.accent}>Email</span><span> or </span><span className={styles.accent}>Number</span>
                    </p>

                    <div className={styles.otpRow}>
                      {otp.map((value, index) => (
                        <div className={styles.otpBox} key={index}>
                          <input
                            ref={(element) => {
                              otpRefs.current[index] = element;
                            }}
                            value={value}
                            onChange={(event) => handleOtpChange(index, event)}
                            inputMode="numeric"
                            maxLength={1}
                          />
                        </div>
                      ))}
                    </div>

                    {error ? <div className={styles.error}><span>{error}</span></div> : null}

                    <button className={styles.button} type="button" onClick={handleVerifyOtp}>
                      Verify OTP
                    </button>

                    <div className={styles.resendGroup}>
                      <div className={styles.resendText}>Didn&apos;t receive the code?</div>
                      <button
                        className={styles.resendButton}
                        type="button"
                        onClick={() => {
                          setOtp(["", "", "", "", "", ""]);
                          setError(null);
                        }}
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </>
                ) : null}

                {step === "reset" ? (
                  <>
                    <h1 className={styles.title}>Reset Password</h1>
                    <p className={`${styles.description} ${styles.compactDescription}`}>
                      Enter your new password to complete the reset.
                    </p>

                    <div className={styles.passwordField}>
                      <span className={styles.lock} aria-hidden="true">
                        *
                      </span>
                      <input
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                      <button
                        className={styles.toggle}
                        type="button"
                        onClick={() => setShowNewPassword((current) => !current)}
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    <div className={styles.passwordField}>
                      <span className={styles.lock} aria-hidden="true">
                        *
                      </span>
                      <input
                        className={`${styles.input} ${error ? styles.inputError : ""}`}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                      />
                      <button
                        className={styles.toggle}
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {error ? <div className={styles.error}><span>{error}</span></div> : null}

                    <button className={styles.button} type="button" onClick={handleResetPassword} disabled={isLoading}>
                      {isLoading ? "Resetting…" : "Reset Password"}
                    </button>
                  </>
                ) : null}

                {step === "request" ? null : (
                  <Link className={styles.loginLink} href="/login">
                    Back to login
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.visualWrap} aria-hidden="true">
              <div className={styles.goldPanel} />
              <Image
                src="/images/Forgot Password (Big Rectangle).png"
                alt=""
                width={276}
                height={337}
                className={styles.photoLarge}
                priority
              />
              <Image
                src="/images/Forgot Password (Small Rectangle).png"
                alt=""
                width={171}
                height={127}
                className={styles.photoSmall}
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
