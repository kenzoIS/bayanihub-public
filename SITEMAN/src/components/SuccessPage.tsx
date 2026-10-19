"use client";

interface SuccessPageProps {
  onSignIn: () => void;
  mode: "email-sent" | "password-updated";
}

export default function SuccessPage({ onSignIn, mode }: SuccessPageProps) {
  const title = mode === "password-updated" ? "Success!" : "Check Your Email";
  const description =
    mode === "password-updated"
      ? "Your password has been successfully reset. You can now sign in with your new credentials."
      : "We sent a Supabase recovery link to the email you entered. Open that link to continue to the password reset screen.";
  const buttonLabel = mode === "password-updated" ? "Sign In to Dashboard" : "Return to Sign In";

  return (
    <div
      className="animate-scaleIn"
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          background: "#FFFFFF",
          borderBottom: "1.5px solid #5C6ED5",
          padding: "20px 36px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="/logo_b.png" alt="BayaniHub Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <span className="font-display" style={{ fontSize: "18px", fontWeight: "700", color: "#3E5A99" }}>
          BayaniHub
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: "500px",
          padding: "40px 36px",
          marginTop: "80px",
        }}
      >
        <div
          className="animate-float"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5E70DC 0%, #2965A2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 40px",
            boxShadow: "0 20px 60px rgba(94,112,220,0.25)",
            position: "relative",
            border: "2px solid #5C6ED5",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-12px",
              borderRadius: "50%",
              border: "2px solid rgba(94,112,220,0.15)",
              animation: "pulse-ring 2.5s ease-in-out infinite",
            }}
          />
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "relative", zIndex: 1 }}
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="font-display" style={{ fontSize: "42px", fontWeight: "800", color: "#3E5A99", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          {title}
        </h1>

        <p style={{ fontSize: "16px", color: "#5C6ED5", lineHeight: "1.7", marginBottom: "48px", maxWidth: "380px" }}>
          {description}
        </p>

        <button
          className="btn-primary"
          onClick={onSignIn}
          style={{ width: "100%", maxWidth: "320px", padding: "16px 32px", fontSize: "15px", fontWeight: "600" }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
