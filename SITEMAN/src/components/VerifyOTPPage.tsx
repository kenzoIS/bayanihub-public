"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { verifyOtp } from "@/lib/supabaseAuth";

interface VerifyOTPPageProps {
  email: string;
  onBack: () => void;
  onNext: (otp: string) => void;
}

export default function VerifyOTPPage({ email, onBack, onNext }: VerifyOTPPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(114);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const timerPct = (timeLeft / 114) * 100;
  const timerColor = timeLeft > 60 ? "#5E70DC" : timeLeft > 30 ? "#f59e0b" : "#ef4444";

  async function handleSubmit() {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit code.");
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await verifyOtp(email, fullOtp);
      onNext(fullOtp);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="animate-fadeIn"
      style={{ width: "100%", height: "100vh", borderRadius: "0px", overflow: "hidden", boxShadow: "none", display: "flex", minHeight: "100vh" }}
    >
      {/* ── Left Panel ── */}
      <div style={{
        flex: 1,
        background: "linear-gradient(155deg, #000000 0%, #000000 35%, #2965A2 65%, #3E5A99 100%)",
        padding: "52px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(94,112,220,0.12) 0%, transparent 70%)", border: "1px solid rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "24px", right: "24px", fontFamily: "'Sora',sans-serif", fontSize: "64px", fontWeight: "900", color: "rgba(255,255,255,0.03)", userSelect: "none" }}></div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="font-display" style={{ fontSize: "38px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1", letterSpacing: "-0.02em" }}>
            Security for your<br />Editorial Journey.
          </h1>
        </div>

        <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "14px", padding: "20px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img 
                src="/logo_b.png" 
                alt="Logo" 
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }}
              />
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}>Multi-Factor Authentication</span>
          </div>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.50)", lineHeight: "1.55" }}>
            Protecting mission-critical data and the integrity of regional relief intelligence through advanced encryption.
          </p>
        </div>

        <div style={{ marginTop: "24px", fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.5px", position: "relative", zIndex: 1 }}>
          V3.4 GUARDIAN PROTOCOL
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ width: "340px", background: "#f6f7fc", padding: "48px 36px", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600", color: "#64748b", fontFamily: "'DM Sans',sans-serif", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "32px", padding: "0" }}
        >
          <ArrowLeft size={13} /> RETURN TO SIGN IN
        </button>

        <h2 className="font-display" style={{ fontSize: "26px", fontWeight: "700", color: "#0a0e1a", marginBottom: "8px" }}>
          Security Verification
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px", lineHeight: "1.55" }}>
          We've sent a 6-digit verification code to your registered email {email}.
        </p>

        {/* OTP inputs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "space-between" }}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKey(idx, e)}
              style={{ flex: 1, minWidth: 0 }}
            />
          ))}
        </div>

        {/* Timer box */}
        <div style={{ background: "#FFFFFF", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", border: "1.5px solid #dde3f0" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2.5px solid ${timerColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.5s" }}>
            <span style={{ fontSize: "8px", fontWeight: "700", color: timerColor, fontFamily: "'Sora',sans-serif" }}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}
            </span>
          </div>
          <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.4" }}>
            The code will expire in{" "}
            <span style={{ fontWeight: "700", color: timerColor, fontFamily: "'Sora',sans-serif" }}>{fmt(timeLeft)}</span>
            . Ensure you have access to your device.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: "#e2e8f0", borderRadius: "3px", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${timerPct}%`, background: timerColor, borderRadius: "3px", transition: "width 1s linear, background 0.5s" }} />
        </div>

        {errorMessage && (
          <div className="status-card status-card--error" style={{ marginBottom: "18px", color: "#ef4444", fontSize: "13px" }}>
            {errorMessage}
          </div>
        )}

        <button
          disabled={timeLeft > 0}
          style={{ background: "none", border: "none", cursor: timeLeft > 0 ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "600", color: timeLeft > 0 ? "#94a3b8" : "#5E70DC", fontFamily: "'DM Sans',sans-serif", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "24px", textAlign: "center", marginTop: "auto" }}
        >
          RESEND CODE
        </button>

        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || fullOtpLength(otp) < 6}>
          {isSubmitting ? "Verifying..." : "Verify Code"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function fullOtpLength(otp: string[]) {
  return otp.join("").length;
}
