import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Building, Users, User, CheckCircle } from "lucide-react";

// Import existing components
import { OnboardingPage } from "@/components/auth/OnboardingPage";
import { CEOOnboardingForm } from "@/components/ceo/CEOOnboardingForm";
import { InviteUserForm } from "@/components/admin/InviteUserForm";

interface CEOOnboardingFlowProps {
  progress: any;
  updateProgress: (newStep: string, completedStep?: string, data?: any) => Promise<boolean>;
  onComplete: () => void;
}

export const CEOOnboardingFlow = ({ progress, updateProgress, onComplete }: CEOOnboardingFlowProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();

  const steps = [
    { id: 'profile', title: 'Udfyld profil', icon: User },
    { id: 'company', title: 'Opret firma', icon: Building },
    { id: 'team', title: 'Inviter medarbejdere', icon: Users },
    { id: 'complete', title: 'Færdig', icon: CheckCircle },
  ];

  useEffect(() => {
    const stepIndex = steps.findIndex(step => step.id === progress.current_step);
    setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
  }, [progress.current_step]);

  const handleStepComplete = async (stepId: string, data?: any) => {
    const currentIndex = steps.findIndex(step => step.id === stepId);
    const nextStep = steps[currentIndex + 1];
    
    if (nextStep) {
      const success = await updateProgress(nextStep.id, stepId, data);
      if (success) {
        setCurrentStepIndex(currentIndex + 1);
      }
    } else {
      // Onboarding complete
      await updateProgress('completed', stepId, data);
      onComplete();
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const renderCurrentStep = () => {
    const currentStep = steps[currentStepIndex];
    
    switch (currentStep?.id) {
      case 'profile':
        return (
          <OnboardingPage
            onComplete={(user) => handleStepComplete('profile', { userProfile: user })}
          />
        );
      
      case 'company':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Opret dit firma</CardTitle>
              <p className="text-muted-foreground">
                Som CEO skal du oprette dit firma og hovedorganisation
              </p>
            </CardHeader>
            <CardContent>
              <CEOOnboardingForm
                onComplete={() => handleStepComplete('company')}
              />
            </CardContent>
          </Card>
        );
      
      case 'team':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Inviter dit team</CardTitle>
              <p className="text-muted-foreground">
                Inviter administratorer og sælgere til din organisation
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <InviteUserForm
                  organizationId={progress.onboarding_data?.organizationId || ""}
                  allowedRoles={["admin", "sales"]}
                />
                
                <div className="text-center pt-6 border-t">
                  <Button 
                    onClick={() => handleStepComplete('team')}
                    variant="outline"
                  >
                    Spring over for nu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 'complete':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Velkommen til AKITA!</CardTitle>
              <p className="text-muted-foreground">
                Din organisation er nu klar. Du kan nu administrere dit team og overvåge salg.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => handleStepComplete('complete')}
                className="w-full"
              >
                Gå til Dashboard
              </Button>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div className="flex-1">
              <CardTitle className="text-xl">CEO Onboarding</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trin {currentStepIndex + 1} af {steps.length}: {steps[currentStepIndex]?.title}
              </p>
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
};