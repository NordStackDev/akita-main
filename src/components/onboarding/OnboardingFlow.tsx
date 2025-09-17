import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

// Import specific onboarding components
import { CEOOnboardingFlow } from "./CEOOnboardingFlow";
import { AdminOnboardingFlow } from "./AdminOnboardingFlow";
import { SalesOnboardingFlow } from "./SalesOnboardingFlow";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOnboardingProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            variant: "destructive",
            title: "Not authenticated",
            description: "Please log in to continue onboarding",
          });
          return;
        }

        const { data: progressData, error } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching onboarding progress:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load onboarding progress",
          });
          return;
        }

        if (!progressData) {
          // No onboarding progress found, redirect to main app
          onComplete();
          return;
        }

        setProgress(progressData);
      } catch (error) {
        console.error('Error in fetchOnboardingProgress:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingProgress();
  }, [onComplete, toast]);

  const updateProgress = async (newStep: string, completedStep?: string, data?: any) => {
    try {
      const updates: any = {
        current_step: newStep,
        updated_at: new Date().toISOString(),
      };

      if (completedStep) {
        const completedSteps = [...(progress.completed_steps || []), completedStep];
        updates.completed_steps = completedSteps;
      }

      if (data) {
        updates.onboarding_data = { ...progress.onboarding_data, ...data };
      }

      const { error } = await supabase
        .from('onboarding_progress')
        .update(updates)
        .eq('id', progress.id);

      if (error) {
        console.error('Error updating onboarding progress:', error);
        return false;
      }

      setProgress({ ...progress, ...updates });
      return true;
    } catch (error) {
      console.error('Error in updateProgress:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading onboarding...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const renderOnboardingFlow = () => {
    switch (progress.role) {
      case 'ceo':
        return (
          <CEOOnboardingFlow
            progress={progress}
            updateProgress={updateProgress}
            onComplete={onComplete}
          />
        );
      case 'admin':
        return (
          <AdminOnboardingFlow
            progress={progress}
            updateProgress={updateProgress}
            onComplete={onComplete}
          />
        );
      case 'sales':
      case 'Sælger':
        return (
          <SalesOnboardingFlow
            progress={progress}
            updateProgress={updateProgress}
            onComplete={onComplete}
          />
        );
      default:
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Unknown Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Unknown role: {progress.role}
              </p>
              <button
                onClick={onComplete}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Continue to Dashboard
              </button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {renderOnboardingFlow()}
      </div>
    </div>
  );
};