import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Head from "next/head";
import {
  Eye,
  EyeOff,
  Lock,
  Shield,
  Mail,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Check,
  CheckCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import LeftPanel, { COLORS } from "@/components/LeftPanel";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3004/api/v1";

// ─── Page types ───────────────────────────────────────────────────────────────

type Page =
  | "login"
  | "forgot-password"
  | "otp-verification"
  | "set-new-password"
  | "password-updated";

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const LoginPage: React.FC<{ onForgotPassword: () => void }> = ({
  onForgotPassword,
}) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
    showPassword: false,
    loading: false,
    error: null as string | null,
  });

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.password) {
      setForm((p) => ({ ...p, error: "Email and password are required." }));
      return;
    }
    setForm((p) => ({ ...p, loading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setForm((p) => ({
          ...p,
          loading: false,
          error: body.message || "Login failed.",
        }));
        return;
      }
      const data = await res.json();
      sessionStorage.setItem("admin-token", data.access_token);
      // Store user profile so Header can display it immediately
      if (data.user?.profile) {
        sessionStorage.setItem(
          "admin-profile",
          JSON.stringify(data.user.profile),
        );
      }
      window.location.href = "/";
    } catch {
      setForm((p) => ({
        ...p,
        loading: false,
        error: "An unexpected error occurred.",
      }));
    }
  };

  return (
    <div style={loginStyles.root}>
      <LeftPanel
        logoSrc="/logo_b.png"
        tagline={
          <>
            Coordinating relief, one
            <br />
            mission at a time.
          </>
        }
        body="The BayaniHub Admin Portal gives you full control over volunteer deployment, donation approvals, inventory management, and real-time mission tracking."
      />
      <main style={loginStyles.rightPanel}>
        <div style={loginStyles.card}>
          <div style={loginStyles.lockIconWrapper}>
            <Lock size={22} color={COLORS.primary} strokeWidth={2} />
          </div>
          <h2 style={loginStyles.cardTitle}>Welcome back</h2>
          <p style={loginStyles.cardSubtitle}>
            Sign in to your Admin account to access the BayaniHub Portal.
          </p>

          <div style={loginStyles.fieldGroup}>
            <label htmlFor="email" style={loginStyles.label}>
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="admin@bayanihub.ph"
              style={loginStyles.input}
              autoComplete="email"
            />
          </div>

          <div style={loginStyles.fieldGroup}>
            <div style={loginStyles.labelRow}>
              <label htmlFor="password" style={loginStyles.label}>
                PASSWORD
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                style={loginStyles.forgotBtn}
              >
                Forgot password?
              </button>
            </div>
            <div style={loginStyles.passwordWrapper}>
              <input
                id="password"
                type={form.showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Enter your password"
                style={{ ...loginStyles.input, paddingRight: "2.75rem" }}
                autoComplete="current-password"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({ ...p, showPassword: !p.showPassword }))
                }
                aria-label={form.showPassword ? "Hide password" : "Show password"}
                style={loginStyles.eyeBtn}
              >
                {form.showPassword ? (
                  <EyeOff size={18} color={COLORS.gray400} />
                ) : (
                  <Eye size={18} color={COLORS.gray400} />
                )}
              </button>
            </div>
          </div>

          <label style={loginStyles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(e) =>
                setForm((p) => ({ ...p, rememberMe: e.target.checked }))
              }
              style={loginStyles.checkbox}
            />
            <span style={loginStyles.checkboxText}>
              Keep me signed in for 30 days
            </span>
          </label>

          {form.error && (
            <div style={loginStyles.errorBanner} role="alert">
              {form.error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={form.loading}
            style={{ ...loginStyles.submitBtn, opacity: form.loading ? 0.7 : 1 }}
          >
            {form.loading ? "Signing in…" : "Sign In to Admin Portal"}
          </button>

          <p style={loginStyles.internalNote}>
            INTERNAL USE ONLY &nbsp;·&nbsp; BayaniHub DRRM Platform
          </p>
        </div>

        <div style={loginStyles.securityNote}>
          <Shield size={13} color={COLORS.gray400} />
          <span style={loginStyles.securityText}>
            &nbsp;Secured with JWT · TLS 1.3 Encrypted
          </span>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const ForgotPasswordPage: React.FC<{
  onBack: () => void;
  onOTPSent: (email: string) => void;
}> = ({ onBack, onOTPSent }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Failed to send OTP.");
        setLoading(false);
        return;
      }
      onOTPSent(email.trim());
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.root}>
      <LeftPanel
        logoSrc="/logo_b.png"
        tagline="Secure password recovery via email OTP."
        body="We'll send a one-time passcode to your registered admin email. The code expires in 10 minutes for your security."
      />
      <main style={{ ...loginStyles.rightPanel, gap: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <button type="button" onClick={onBack} style={loginStyles.backBtn}>
            <ArrowLeft size={14} strokeWidth={2.5} />
            &nbsp;Back to login
          </button>
        </div>

        <div style={loginStyles.card}>
          <div
            style={{
              ...loginStyles.lockIconWrapper,
              backgroundColor: "#FEF3C7",
            }}
          >
            <Mail size={22} color="#D97706" strokeWidth={2} />
          </div>
          <h2 style={loginStyles.cardTitle}>Forgot your password?</h2>
          <p style={loginStyles.cardSubtitle}>
            Enter your registered admin email. We&apos;ll send a 6-digit OTP to
            verify your identity.
          </p>

          <div style={loginStyles.fieldGroup}>
            <label htmlFor="admin-email" style={loginStyles.label}>
              ADMIN EMAIL ADDRESS
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="admin@bayanihub.ph"
              style={loginStyles.input}
              autoComplete="email"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {error && (
            <div style={loginStyles.errorBanner}>
              <AlertCircle
                size={15}
                color="#DC2626"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#DC2626" }}>
                {error}
              </p>
            </div>
          )}

          <div style={loginStyles.infoBanner}>
            <AlertCircle
              size={15}
              color="#D97706"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400E" }}>
              Only registered admin accounts can request a password reset. If
              your email is not recognized, contact your system administrator.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email.trim()}
            style={{
              ...loginStyles.submitBtn,
              opacity: loading || !email.trim() ? 0.7 : 1,
              cursor: loading || !email.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending OTP…" : "Send OTP to Email"}
          </button>

          <p style={loginStyles.internalNote}>
            INTERNAL USE ONLY &nbsp;·&nbsp; BayaniHub DRRM Platform
          </p>
        </div>

        <div style={loginStyles.securityNote}>
          <Shield size={13} color={COLORS.gray400} />
          <span style={loginStyles.securityText}>
            &nbsp;Secured with JWT · TLS 1.3 Encrypted
          </span>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OTP VERIFICATION PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const OTPVerificationPage: React.FC<{
  email: string;
  onBack: () => void;
  onVerified: (otp: string) => void;
}> = ({ email, onBack, onVerified }) => {
  const OTP_LENGTH = 6;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(120);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[i] = val;
    setDigits(updated);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const updated = [...digits];
    pasted.split("").forEach((c, i) => {
      updated[i] = c;
    });
    setDigits(updated);
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    if (!digits.every((d) => d !== "")) return;
    setLoading(true);
    setError(null);
    const code = digits.join("");
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || "Invalid OTP code.");
        setLoading(false);
        return;
      }
      onVerified(code);
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.root}>
      <LeftPanel
        logoSrc="/logo_b.png"
        tagline="Check your email for the 6-digit code."
        body="The OTP was sent to your registered admin email. Enter it below to verify your identity before resetting your password."
        extraContent={
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: "0.5rem",
              padding: "0.65rem 0.9rem",
              marginTop: "0.5rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "0.2rem",
              }}
            >
              SENT TO
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                color: "#FFFFFF",
                fontWeight: 600,
                wordBreak: "break-all",
              }}
            >
              {email}
            </span>
          </div>
        }
      />
      <main style={{ ...loginStyles.rightPanel, gap: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <button type="button" onClick={onBack} style={loginStyles.backBtn}>
            <ArrowLeft size={14} strokeWidth={2.5} />
            &nbsp;Back
          </button>
        </div>

        <div style={loginStyles.card}>
          <div style={loginStyles.lockIconWrapper}>
            <ShieldCheck size={22} color={COLORS.primary} strokeWidth={2} />
          </div>
          <h2 style={loginStyles.cardTitle}>Enter verification code</h2>
          <p style={loginStyles.cardSubtitle}>
            We sent a 6-digit OTP to{" "}
            <strong style={{ color: COLORS.gray700 }}>{email}</strong>.
          </p>

          <div
            style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                style={{
                  width: 52,
                  height: 56,
                  borderRadius: "0.5rem",
                  border: `1.5px solid ${digit ? COLORS.primary : COLORS.gray300}`,
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  textAlign: "center",
                  color: COLORS.gray700,
                  outline: "none",
                  backgroundColor: COLORS.white,
                  boxShadow: digit
                    ? `0 0 0 2px ${COLORS.primary}33`
                    : "none",
                }}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: COLORS.gray500 }}>
              Code expires in{" "}
              <strong style={{ color: seconds > 30 ? COLORS.primary : "#DC2626" }}>
                {formatted}
              </strong>
            </span>
            <button
              type="button"
              onClick={async () => {
                if (seconds > 0) return;
                setDigits(Array(OTP_LENGTH).fill(""));
                setError(null);
                setSeconds(120);
                try {
                  await fetch(`${API_BASE}/auth/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                } catch { /* ignore resend errors */ }
              }}
              disabled={seconds > 0}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: seconds > 0 ? COLORS.gray400 : COLORS.primary,
                cursor: seconds > 0 ? "not-allowed" : "pointer",
              }}
            >
              Resend code
            </button>
          </div>

          {error && (
            <div style={loginStyles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !digits.every((d) => d !== "")}
            style={{
              ...loginStyles.submitBtn,
              opacity:
                loading || !digits.every((d) => d !== "") ? 0.7 : 1,
              cursor:
                loading || !digits.every((d) => d !== "")
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? "Verifying…" : "Verify Code"}
          </button>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SET NEW PASSWORD PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const SetNewPasswordPage: React.FC<{
  email: string;
  otp: string;
  onBack: () => void;
  onPasswordUpdated: () => void;
}> = ({ email, otp, onBack, onPasswordUpdated }) => {
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
    showNew: false,
    showConfirm: false,
    loading: false,
    error: null as string | null,
  });

  const rules = useMemo(
    () => [
      { label: "Minimum 8 characters", met: form.newPassword.length >= 8 },
      { label: "At least one number", met: /\d/.test(form.newPassword) },
      {
        label: "At least one special character",
        met: /[^A-Za-z0-9]/.test(form.newPassword),
      },
    ],
    [form.newPassword],
  );

  const allRulesMet = rules.every((r) => r.met);
  const isSubmittable = allRulesMet && form.confirmPassword.length > 0 && !form.loading;

  const handleSubmit = async () => {
    if (!isSubmittable) return;
    if (form.newPassword !== form.confirmPassword) {
      setForm((p) => ({ ...p, error: "Passwords do not match." }));
      return;
    }
    setForm((p) => ({ ...p, loading: true, error: null }));
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: form.newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setForm((p) => ({
          ...p,
          loading: false,
          error: body.message || "Failed to update password.",
        }));
        return;
      }
      onPasswordUpdated();
    } catch {
      setForm((p) => ({
        ...p,
        loading: false,
        error: "An unexpected error occurred.",
      }));
    }
  };

  return (
    <div style={loginStyles.root}>
      <LeftPanel
        logoSrc="/logo_b.png"
        tagline="Create a strong new password for your account."
        body="Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols."
      />
      <main style={{ ...loginStyles.rightPanel, gap: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <button type="button" onClick={onBack} style={loginStyles.backBtn}>
            <ArrowLeft size={14} strokeWidth={2.5} />
            &nbsp;Back
          </button>
        </div>

        <div style={loginStyles.card}>
          <div
            style={{
              ...loginStyles.lockIconWrapper,
              backgroundColor: "#DCFCE7",
            }}
          >
            <KeyRound size={22} color="#16A34A" strokeWidth={2} />
          </div>
          <h2 style={loginStyles.cardTitle}>Set new password</h2>
          <p style={loginStyles.cardSubtitle}>
            Identity verified. Create a new strong password for your admin
            account.
          </p>

          {/* Password requirements — above fields */}
          <div style={loginStyles.cardRulesBlock}>
            {rules.map((rule) => (
              <div
                key={rule.label}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: rule.met ? "#DCFCE7" : COLORS.gray100,
                    transition: "background-color 0.2s",
                  }}
                >
                  <Check
                    size={10}
                    color={rule.met ? "#16A34A" : COLORS.gray400}
                    strokeWidth={3}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: rule.met ? "#16A34A" : COLORS.gray400,
                    transition: "color 0.2s",
                  }}
                >
                  {rule.label}
                </span>
              </div>
            ))}
          </div>

          {["new", "confirm"].map((field) => {
            const isNew = field === "new";
            const value = isNew ? form.newPassword : form.confirmPassword;
            const show = isNew ? form.showNew : form.showConfirm;
            return (
              <div key={field} style={loginStyles.fieldGroup}>
                <label style={loginStyles.label}>
                  {isNew ? "NEW PASSWORD" : "CONFIRM NEW PASSWORD"}
                </label>
                <div style={loginStyles.passwordWrapper}>
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [isNew ? "newPassword" : "confirmPassword"]:
                          e.target.value,
                        error: null,
                      }))
                    }
                    placeholder={
                      isNew
                        ? "Create a strong password"
                        : "Re-enter your new password"
                    }
                    style={{ ...loginStyles.input, paddingRight: "2.75rem" }}
                    autoComplete={isNew ? "new-password" : "off"}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        [isNew ? "showNew" : "showConfirm"]: !show,
                      }))
                    }
                    style={loginStyles.eyeBtn}
                  >
                    {show ? (
                      <EyeOff size={18} color={COLORS.gray400} />
                    ) : (
                      <Eye size={18} color={COLORS.gray400} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {form.error && (
            <div style={loginStyles.errorBanner} role="alert">
              {form.error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isSubmittable}
            style={{
              ...loginStyles.submitBtn,
              opacity: !isSubmittable ? 0.7 : 1,
              cursor: !isSubmittable ? "not-allowed" : "pointer",
            }}
          >
            {form.loading ? "Updating password…" : "Update Password"}
          </button>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PASSWORD UPDATED PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const PasswordUpdatedPage: React.FC<{
  email: string;
  resetTime: Date;
  onSignIn: () => void;
}> = ({ email, resetTime, onSignIn }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onSignIn();
      return;
    }
    const id = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [countdown, onSignIn]);

  const formattedTime = resetTime.toLocaleString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={loginStyles.root}>
      <LeftPanel
        logoSrc="/logo_b.png"
        tagline="Password successfully updated."
        body="A confirmation email has been sent to all registered admin emails as a security notification. If you did not initiate this change, contact your system administrator immediately."
        extraContent={
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: "0.5rem",
              padding: "0.75rem 0.9rem",
              marginTop: "0.5rem",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "0.3rem",
              }}
            >
              SECURITY NOTICE
            </span>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              All active sessions for this account have been invalidated. Sign
              in again with your new password.
            </p>
          </div>
        }
      />
      <main style={loginStyles.rightPanel}>
        <div style={loginStyles.card}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "#DCFCE7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.5rem",
            }}
          >
            <CheckCircle size={40} color="#16A34A" strokeWidth={2} />
          </div>

          <h2 style={loginStyles.cardTitle}>Password updated!</h2>
          <p style={loginStyles.cardSubtitle}>
            Your admin account password has been changed successfully.
          </p>

          <div
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: "0.5rem",
              padding: "0.75rem 0.9rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "0.4rem",
                backgroundColor: "#DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={16} color={COLORS.primary} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: COLORS.gray700,
                }}
              >
                Email notification sent
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: COLORS.gray500,
                  lineHeight: 1.5,
                }}
              >
                Password updated email dispatched to{" "}
                <strong style={{ color: COLORS.gray700 }}>{email}</strong>.
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: COLORS.gray50,
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
            }}
          >
            <p
              style={{
                margin: "0 0 0.5rem",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: COLORS.gray500,
              }}
            >
              PASSWORD RESET SUMMARY
            </p>
            {[
              { label: "Admin account", value: email, style: {} },
              { label: "Reset time", value: formattedTime, style: {} },
              {
                label: "Sessions invalidated",
                value: "All previous sessions",
                style: { color: "#E84B1A", fontWeight: 600 },
              },
              {
                label: "Email notification",
                value: "Sent ✓",
                style: { color: "#16A34A", fontWeight: 600 },
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.4rem 0",
                  borderBottom: `1px solid ${COLORS.gray100}`,
                  gap: "1rem",
                }}
              >
                <span
                  style={{ fontSize: "0.8rem", color: COLORS.gray500 }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: COLORS.gray700,
                    textAlign: "right",
                    wordBreak: "break-all",
                    ...row.style,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={14} color={COLORS.gray400} />
            <span
              style={{ fontSize: "0.82rem", color: COLORS.gray500, marginLeft: 4 }}
            >
              Redirecting to login in{" "}
              <strong style={{ color: COLORS.primary }}>{countdown}</strong> s
            </span>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            style={loginStyles.submitBtn}
          >
            Sign In with New Password&nbsp;
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export default function LoginRouter() {
  const [page, setPage] = useState<Page>("login");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [resetTime, setResetTime] = useState<Date>(new Date());

  // If already logged in redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin-token")) {
      window.location.href = "/";
    }
  }, []);

  const handleOTPSent = useCallback((email: string) => {
    setAdminEmail(email);
    setPage("otp-verification");
  }, []);

  const handlePasswordUpdated = useCallback(() => {
    setResetTime(new Date());
    setPage("password-updated");
  }, []);

  switch (page) {
    case "forgot-password":
      return (
        <ForgotPasswordPage
          onBack={() => setPage("login")}
          onOTPSent={handleOTPSent}
        />
      );
    case "otp-verification":
      return (
        <OTPVerificationPage
          email={adminEmail}
          onBack={() => setPage("forgot-password")}
          onVerified={(otp: string) => {
            setAdminOtp(otp);
            setPage("set-new-password");
          }}
        />
      );
    case "set-new-password":
      return (
        <SetNewPasswordPage
          email={adminEmail}
          otp={adminOtp}
          onBack={() => setPage("otp-verification")}
          onPasswordUpdated={handlePasswordUpdated}
        />
      );
    case "password-updated":
      return (
        <PasswordUpdatedPage
          email={adminEmail}
          resetTime={resetTime}
          onSignIn={() => setPage("login")}
        />
      );
    default:
      return <LoginPage onForgotPassword={() => setPage("forgot-password")} />;
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const loginStyles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: COLORS.gray100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1.5rem",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: "1rem",
    padding: "2.5rem 2.25rem",
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    boxSizing: "border-box",
  },
  lockIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: "0.65rem",
    backgroundColor: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.2rem",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.45rem",
    fontWeight: 700,
    color: COLORS.gray700,
  },
  cardSubtitle: {
    margin: 0,
    fontSize: "0.88rem",
    color: COLORS.gray500,
    lineHeight: 1.6,
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: {
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: COLORS.gray500,
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "0.65rem 0.9rem",
    fontSize: "0.9rem",
    border: `1px solid ${COLORS.gray300}`,
    borderRadius: "0.5rem",
    outline: "none",
    color: COLORS.gray700,
    backgroundColor: COLORS.white,
    boxSizing: "border-box",
  },
  passwordWrapper: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 0,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  checkbox: { width: 15, height: 15, accentColor: COLORS.primary },
  checkboxText: { fontSize: "0.85rem", color: COLORS.gray500 },
  forgotBtn: {
    background: "none",
    border: "none",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: COLORS.primary,
    cursor: "pointer",
    padding: 0,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "0.5rem",
    padding: "0.65rem 0.85rem",
    fontSize: "0.85rem",
    color: "#DC2626",
  },
  cardRulesBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
    backgroundColor: COLORS.gray50,
    borderRadius: "0.5rem",
    padding: "0.75rem 0.9rem",
    border: `1px solid ${COLORS.gray100}`,
  },
  infoBanner: {
    display: "flex",
    gap: "0.6rem",
    backgroundColor: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: "0.5rem",
    padding: "0.75rem 0.9rem",
    alignItems: "flex-start",
  },
  submitBtn: {
    width: "100%",
    padding: "0.85rem",
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: "0.95rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
  },
  internalNote: {
    margin: "0.2rem 0 0",
    textAlign: "center",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "0.1em",
    color: COLORS.gray400,
  },
  securityNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "0.5rem",
  },
  securityText: { fontSize: "0.78rem", color: COLORS.gray400 },
  backBtn: {
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    color: COLORS.gray500,
    fontWeight: 500,
    padding: 0,
    gap: "0.2rem",
  },
};
