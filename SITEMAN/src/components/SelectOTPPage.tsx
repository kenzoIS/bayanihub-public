"use client";

import { useState } from "react";
import { ArrowLeft, Info, Mail, Send } from "lucide-react";
import { sendPasswordRecovery } from "@/lib/supabaseAuth";

interface SelectOTPPageProps {
  onBack: () => void;
  onNext: (email: string) => void;
}

export default function SelectOTPPage({ onBack, onNext }: SelectOTPPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await sendPasswordRecovery(email);
      onNext(email);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send the recovery email.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="animate-fadeIn"
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          flex: 1,
          background: "linear-gradient(155deg, #000000 0%, #000000 35%, #2965A2 65%, #3E5A99 100%)",
          padding: "52px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(94,112,220,0.12) 0%, transparent 70%)", border: "1px solid rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="font-display" style={{ fontSize: "38px", fontWeight: "800", color: "#FFFFFF", lineHeight: "1.1", letterSpacing: "-0.02em" }}>
            Security for your
            <br />
            Editorial Journey.
          </h1>
        </div>

        <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "14px", padding: "20px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
            <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <img src="/logo_b.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#FFFFFF" }}>Password Recovery</span>
          </div>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.50)", lineHeight: "1.55" }}>
            This form sends a real recovery email through Supabase Auth for existing users in your project.
          </p>
        </div>
      </div>

      <div style={{ width: "340px", background: "#f6f7fc", padding: "48px 36px", display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#5E70DC", fontFamily: "'DM Sans',sans-serif", fontWeight: "500", marginBottom: "32px", padding: "0" }}
        >
          <ArrowLeft size={14} /> Return to Sign In
        </button>

        <h2 className="font-display" style={{ fontSize: "26px", fontWeight: "700", color: "#0a0e1a", marginBottom: "8px", lineHeight: "1.2" }}>
          Reset Password
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "28px", lineHeight: "1.55" }}>
          Enter the same email address that exists in Supabase Authentication Users.
        </p>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
            Enter Your Email
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
              <Mail size={15} />
            </div>
            <input
              className="input-field"
              type="email"
              placeholder="admin@bayanihub.ph"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ paddingLeft: "42px" }}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#FFFFFF", border: "1.5px solid #dde3f0", borderRadius: "10px", padding: "12px 14px", marginBottom: "28px" }}>
          <Info size={14} color="#5C6ED5" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: "1.5" }}>
            Supabase will email a reset link to this address. Open that link to continue to the new password screen.
          </p>
        </div>

        {errorMessage && (
          <div className="status-card status-card--error" style={{ marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} style={{ marginTop: "auto" }} disabled={isSubmitting}>
          {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"} <Send size={15} />
        </button>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "12.5px", color: "#94a3b8", paddingBottom: "20px" }}>
          Having trouble with verification?{" "}
          <a href="#" style={{ color: "#5E70DC", textDecoration: "none", fontWeight: "500" }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
