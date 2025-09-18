import React, { useState } from "react";
import { OnboardingPage } from "@/components/auth/OnboardingPage";
import { CEOOnboardingForm } from "@/components/ceo/CEOOnboardingForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoleBasedOnboardingProps {
  role: "ceo" | "admin" | "sales";
  onComplete: () => void;
}

export const RoleBasedOnboarding: React.FC<RoleBasedOnboardingProps> = ({ role, onComplete }) => {
  const [step, setStep] = useState(0);
  console.log('[RoleBasedOnboarding] role:', role, 'step:', step);

  // CEO steps: Kun personlig info og firmaoprettelse
  if (role === "ceo") {
    switch (step) {
      case 0:
        return (
          <OnboardingPage onComplete={(user) => {
            console.log('[RoleBasedOnboarding] CEO onboarding: completed personal info, going to step 1', user);
            setStep(1);
          }} />
        );
      case 1:
        return (
          <CEOOnboardingForm onComplete={() => {
            console.log('[RoleBasedOnboarding] CEO onboarding: completed company/org creation, calling onComplete');
            onComplete();
          }} />
        );
      default:
        return null;
    }
  }

  // Admin steps
  if (role === "admin") {
    switch (step) {
      case 0:
        return (
          <OnboardingPage onComplete={() => setStep(1)} />
        );
      case 1:
        return (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle>Intro til admin-funktioner</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Admin intro content */}
              <Button onClick={onComplete}>Afslut onboarding</Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  // Sælger steps: kun personlig info, derefter afslut
  if (role === "sales") {
    return <OnboardingPage onComplete={onComplete} />;
  }

  return null;
};
