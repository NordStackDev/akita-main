import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Shield, User, CheckCircle, Settings } from "lucide-react";

interface AdminOnboardingFlowProps {
  progress: any;
  updateProgress: (newStep: string, completedStep?: string, data?: any) => Promise<boolean>;
  onComplete: () => void;
}

export const AdminOnboardingFlow = ({ progress, updateProgress, onComplete }: AdminOnboardingFlowProps) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { id: 'profile', title: 'Bekræft profil', icon: User },
    { id: 'admin_intro', title: 'Admin funktioner', icon: Settings },
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
                Verificer dine oplysninger som administrator
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Din rolle: Administrator</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Som administrator kan du invitere nye brugere, administrere organisationen og overvåge teams.
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
      
      case 'admin_intro':
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin funktioner</CardTitle>
              <p className="text-muted-foreground">
                Lær om dine muligheder som administrator
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Brugeradministration
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Inviter nye brugere, administrer roller og hold styr på dit team.
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-green-500" />
                    Organisationsindstillinger
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Konfigurer organisationsindstillinger og præferencer.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleStepComplete('admin_intro')}
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
                Du er nu klar til at administrere din organisation.
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
            <Shield className="w-8 h-8 text-blue-500" />
            <div className="flex-1">
              <CardTitle className="text-xl">Administrator Onboarding</CardTitle>
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