import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, User, CheckCircle, TrendingUp } from "lucide-react";

interface SalesOnboardingFlowProps {
  progress: any;
  updateProgress: (newStep: string, completedStep?: string, data?: any) => Promise<boolean>;
  onComplete: () => void;
}

export const SalesOnboardingFlow = ({ progress, updateProgress, onComplete }: SalesOnboardingFlowProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { id: 'profile', title: 'Bekræft profil', icon: User },
    { id: 'sales_intro', title: 'Salgs dashboard', icon: TrendingUp },
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
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Bekræft din profil</CardTitle>
              <p className="text-muted-foreground">
                Verificer dine oplysninger som sælger
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Din rolle: Sælger</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Som sælger kan du registrere salg, se dine resultater og deltage i challenges.
                </p>
              </div>
              
              <Button 
                onClick={() => handleStepComplete('profile')}
                className="w-full"
              >
                Bekræft profil
              </Button>
            </CardContent>
          </Card>
        );
      
      case 'sales_intro':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Dit salgs dashboard</CardTitle>
              <p className="text-muted-foreground">
                Lær om dine muligheder som sælger
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Registrer salg
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Registrer dine salg hurtigt og enkelt direkte fra din mobil.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Se dine resultater
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Følg dine salgstal, point og sammenlign med teamet.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleStepComplete('sales_intro')}
                className="w-full"
              >
                Forstået, fortsæt
              </Button>
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
                Du er nu klar til at begynde at sælge og tjene point.
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Target className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <CardTitle className="text-xl">Sælger Onboarding</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trin {currentStepIndex + 1} af {steps.length}: {steps[currentStepIndex]?.title}
              </p>
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      {renderCurrentStep()}
    </div>
  );
};