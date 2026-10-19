"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { signInWithPassword } from "@/lib/supabaseAuth";

interface LoginPageProps {
  onForgotPassword: () => void;
}

export default function LoginPage({ onForgotPassword }: LoginPageProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signInWithPassword(email, password);
      setIsTransitioning(true);
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 650);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in right now.",
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
      {isTransitioning && (
        <div className="login-transition-overlay">
          <div className="login-transition-card">
            <img
              src="/logo_b.png"
              alt="BayaniHub Logo"
              style={{ width: "52px", height: "52px", objectFit: "contain" }}
            />
            <div className="font-display" style={{ fontSize: "24px", fontWeight: 700 }}>
              Opening Dashboard
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: "280px" }}>
              Authenticating your secure command link and loading the site manager console.
            </p>
            <div className="login-transition-bar">
              <span />
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          background: "linear-gradient(145deg, #2965A2 0%, #000000 45%, #000000 100%)",
          padding: "52px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "240px",
            height: "240px",
            background: "radial-gradient(circle, rgba(92,110,213,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "-40px",
            width: "180px",
            height: "180px",
            background: "radial-gradient(circle, rgba(66,101,255,0.10) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "10px",
              fontWeight: "600",
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.40)",
              marginBottom: "16px",
              textTransform: "uppercase",
            }}
          >
            Site Manager
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <img
              src="/logo_b.png"
              alt="BayaniHub Logo"
              style={{ width: "48px", height: "48px", objectFit: "contain" }}
            />
            <h1
              className="font-display"
              style={{
                fontSize: "42px",
                fontWeight: "800",
                color: "#FFFFFF",
                lineHeight: "1.05",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              BayaniHub
            </h1>
          </div>

          <p
            style={{
              color: "rgba(255,255,255,0.50)",
              fontSize: "14px",
              lineHeight: "1.65",
              maxWidth: "280px",
            }}
          >
            Empowering site managers with real-time clarity. Coordinate relief,
            manage inventory, and serve your community with a command center
            built for high-stakes impact.
          </p>
        </div>

        <div style={{ display: "flex", gap: "32px", position: "relative", zIndex: 1 }}>
          <div>
            <div className="font-display" style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF" }}>
              124
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "2px" }}>
              Active Hubs
            </div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.12)" }} />
          <div>
            <div className="font-display" style={{ fontSize: "28px", fontWeight: "700", color: "#FFFFFF" }}>
              8.2k
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "2px" }}>
              Volunteers
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          width: "340px",
          background: "#f6f7fc",
          padding: "48px 36px",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="font-display" style={{ fontSize: "24px", fontWeight: "700", color: "#0a0e1a", marginBottom: "6px" }}>
            Site Manager Login
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "32px", lineHeight: "1.5" }}>
            Enter your Supabase Auth email and password to access the dashboard.
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              Access Role
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                border: "1.5px solid #dde3f0",
                borderRadius: "10px",
                background: "#FFFFFF",
              }}
            >
              <span style={{ fontSize: "14px", color: "#0a0e1a", fontWeight: "500" }}>Site Manager</span>
              <Lock size={15} color="#94a3b8" />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              Manager Email
            </label>
            <input
              className="input-field"
              type="email"
              placeholder="admin@bayanihub.ph"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "1.2px", color: "#94a3b8", textTransform: "uppercase" }}>
                Secure Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{ fontSize: "12px", color: "#5E70DC", background: "none", border: "none", cursor: "pointer", fontWeight: "500", fontFamily: "'DM Sans', sans-serif" }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{ paddingRight: "44px" }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="status-card status-card--error" style={{ marginBottom: "18px" }}>
              {errorMessage}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Enter Dashboard"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            padding: "14px 16px",
            background: "#FFFFFF",
            borderRadius: "12px",
            border: "1.5px solid #e8edf8",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #2965A2, #5E70DC)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Shield size={15} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#0a0e1a", marginBottom: "2px" }}>
              Secure Command Link
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.5" }}>
              Your session is validated against Supabase Auth before access is granted to the dashboard.
            </div>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            POWERED BY <span style={{ fontWeight: "700", color: "#5E70DC" }}>BayaniHub</span>
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            {["PRIVACY", "SUPPORT"].map((item) => (
              <a key={item} href="#" style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "none" }}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
