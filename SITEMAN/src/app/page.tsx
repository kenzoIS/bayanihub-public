"use client";

import { useState } from "react";
import LoginPage from "@/components/LoginPage";
import SelectOTPPage from "@/components/SelectOTPPage";
import VerifyOTPPage from "@/components/VerifyOTPPage";
import SetPasswordPage from "@/components/SetPasswordPage";
import SuccessPage from "@/components/SuccessPage";
import { type RecoverySession } from "@/lib/supabaseAuth";
import { useRouter } from "next/navigation";

export type Screen = "login" | "select-otp" | "verify-otp" | "set-password" | "success";

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("login");
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);
  const [emailToVerify, setEmailToVerify] = useState<string>("");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 0,
        margin: 0,
      }}
    >
      {screen === "login" && (
        <LoginPage 
          onForgotPassword={() => setScreen("select-otp")} 
        />
      )}
      {screen === "select-otp" && (
        <SelectOTPPage
          onBack={() => setScreen("login")}
          onNext={(email) => {
            setEmailToVerify(email);
            setScreen("verify-otp");
          }}
        />
      )}
      {screen === "verify-otp" && (
        <VerifyOTPPage
          email={emailToVerify}
          onBack={() => setScreen("select-otp")}
          onNext={(otp) => {
            setRecoverySession({ email: emailToVerify, otp });
            setScreen("set-password");
          }}
        />
      )}
      {screen === "set-password" && (
        <SetPasswordPage
          recoverySession={recoverySession}
          onBack={() => setScreen("login")}
          onNext={() => setScreen("success")}
        />
      )}
      {screen === "success" && (
        <SuccessPage
          onSignIn={() => {
            setRecoverySession(null);
            setScreen("login");
          }}
          mode={recoverySession ? "password-updated" : "email-sent"}
        />
      )}
    </main>
  );
}
