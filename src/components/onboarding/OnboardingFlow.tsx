import React, { useState, memo } from "react";
import { OnboardingPage } from "@/components/auth/OnboardingPage";
import { CEOOnboardingForm } from "@/components/ceo/CEOOnboardingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingFlowProps {
  role: "ceo" | "admin" | "sales";
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = memo(({ role, onComplete }) => {
  const [step, setStep] = useState(0);

  // CEO flow: Personal info → Company creation
  if (role === "ceo") {
    switch (step) {
      case 0:
        return (
          <OnboardingPage onComplete={() => setStep(1)} />
        );
      case 1:
        return (
          <CEOOnboardingForm onComplete={onComplete} />
        );
      default:
        return null;
    }
  }

  // Admin flow: Personal info → Admin intro
  if (role === "admin") {
    switch (step) {
      case 0:
        return (
          <OnboardingPage onComplete={() => setStep(1)} />
        );
      case 1:
        return (
          <Card className="max-w-md mx-auto mt-8 akita-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Intro til admin-funktioner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Som administrator har du adgang til at administrere organisationen, invitere brugere og overvåge aktivitet.
              </p>
              <Button onClick={onComplete} className="w-full akita-gradient hover:akita-glow akita-transition">
                Afslut onboarding
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  // Sales flow: Just personal info
  if (role === "sales") {
    return <OnboardingPage onComplete={onComplete} />;
  }

  return null;
});