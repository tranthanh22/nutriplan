"use client";

import { useEffect, useState } from "react";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { NutriPlanApp } from "@/components/nutriplan-app";
import { getSession } from "@/features/onboarding/onboarding.service";

type AuthState = "loading" | "unauthenticated" | "needs_onboarding" | "authenticated";

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    getSession()
      .then((session) => {
        if (session) {
          setAccessToken(session.access_token);
          // If user just confirmed email link via hash, start onboarding steps
          setAuthState("needs_onboarding");
        } else {
          setAuthState("unauthenticated");
        }
      })
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          background: "white",
        }}
      >
        <div className="ob-spinner-ring" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <OnboardingShell onComplete={() => setAuthState("authenticated")} />
    );
  }

  if (authState === "needs_onboarding") {
    return (
      <OnboardingShell
        initialAccessToken={accessToken}
        onComplete={() => setAuthState("authenticated")}
      />
    );
  }

  return <NutriPlanApp />;
}
