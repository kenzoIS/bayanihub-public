"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { type RecoverySession, updatePassword } from "@/lib/supabaseAuth";

interface SetPasswordPageProps {
  recoverySession: RecoverySession | null;
  onBack: () => void;
  onNext: () => void;
}

export default function SetPasswordPage({
  recoverySession,
  onBack,
  onNext,
}: SetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const checks = {
    length: password.length >= 12,
    special: /[@#$!%^&*]/.test(password),
    mixed: /[A-Z]/.test(password) && /[0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const pct = (score / 3) * 100;
  const label = score === 0 ? "" : score === 1 ? "WEAK" : score === 2 ? "MODERATE" : "STRONG";
  const color = score <= 1 ? "#ef4444" : score === 2 ? "#f59e0b" : "#22c55e";
  const canSubmit = Object.values(checks).every(Boolean) && password === confirm;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!recoverySession || !recoverySession.email || !recoverySession.otp) {
      setErrorMessage("Invalid or missing recovery session data (email/otp). Please go back and try again.");
      return;
    }

    if (!canSubmit) {
      setErrorMessage("Enter a strong password and make sure the confirmation matches.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(recoverySession, password);
      onNext();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update the password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="animate-fadeIn"
      style={{ width: "100%", height: "100vh", overflow: "hidden", display: "flex", minHeight: "100vh" }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: "580px" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, #000000 0%, #2965A2 50%, #3E5A99 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(88deg, transparent, transparent 18px, rgba(255,255,255,0.015) 18px, rgba(255,255,255,0.015) 19px)" }} />
        <div style={{ position: "absolute", top: "35%", left: "30%", right: "-20%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(92,110,213,0.4), transparent)", transform: "rotate(-5deg)" }} />

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 40px 52px", background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/logo_b.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span className="font-display" style={{ fontSize: "16px", fontWeight: "700", color: "#FFFFFF" }}>BayaniHub</span>
          </div>
          <h2 className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "#FFFFFF", marginBottom: "8px" }}>
            Security for your Editorial Journey.
          </h2>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.45)", lineHeight: "1.55" }}>
            A secure password protects your contributions to the community archive. Choose a phrase that is memorable yet robust.
          </p>
        </div>
      </div>

      <div style={{ width: "340px", background: "#f6f7fc", padding: "48px 36px", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#5E70DC", fontFamily: "'DM Sans',sans-serif", fontWeight: "500", marginBottom: "24px", padding: "0" }}
        >
          ← Return to Sign In
        </button>

        <form onSubmit={handleSubmit}>
          <h2 className="font-display" style={{ fontSize: "22px", fontWeight: "700", color: "#0a0e1a", marginBottom: "8px" }}>
            Create New Password
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "28px", lineHeight: "1.55" }}>
            This screen becomes active after verifying your 6-digit email OTP.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPass ? "text" : "password"}
                placeholder="Enter a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{ background: "#FFFFFF", paddingRight: "44px" }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass((current) => !current)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1.5px solid #dde3f0", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px", color: "#64748b", textTransform: "uppercase", marginBottom: "12px" }}>
              Strength Requirements
            </p>

            {[
              { key: "length", label: "At least 12 characters long" },
              { key: "special", label: "Include a special character (e.g. @, #, $)" },
              { key: "mixed", label: "Mix of uppercase and numbers" },
            ].map(({ key, label: itemLabel }) => {
              const ok = checks[key as keyof typeof checks];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: ok ? "#dcfce7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.3s" }}>
                    {ok ? <Check size={10} color="#16a34a" strokeWidth={3} /> : <X size={10} color="#dc2626" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: "12.5px", color: ok ? "#16a34a" : "#64748b", transition: "color 0.3s" }}>{itemLabel}</span>
                </div>
              );
            })}

            <div style={{ marginTop: "12px" }}>
              <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "5px", transition: "width 0.4s, background 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", color, letterSpacing: "0.5px" }}>{label}</span>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>STRONG</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                style={{ background: "#FFFFFF", paddingRight: "44px", borderColor: confirm && confirm !== password ? "#ef4444" : undefined }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((current) => !current)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px" }}>Passwords do not match</p>
            )}
          </div>

          {errorMessage && (
            <div className="status-card status-card--error" style={{ marginBottom: "18px" }}>
              {errorMessage}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? "Updating Password..." : "Update Password"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
