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
      .then(async (session) => {
        if (session) {
          setAccessToken(session.access_token);
          
          // Check if user has completed nutrition profile onboarding
          try {
            const { apiClient } = await import("@/lib/api-client");
            const profile = await apiClient.get<{ id: string }>('/nutrition-profiles/current', session.access_token);
            if (profile && profile.id) {
              setAuthState("authenticated");
            } else {
              setAuthState("needs_onboarding");
            }
          } catch {
            // No profile found yet -> Needs onboarding step 3+
            setAuthState("needs_onboarding");
          }
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
