import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OnboardingPage } from "./OnboardingPage";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if onboarding is needed
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_login_completed, force_password_reset')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData && (userData.force_password_reset || !userData.first_login_completed)) {
          setShowOnboarding(true);
        } else {
          onLogin(session.user);
          navigate("/app/dashboard");
        }
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Try to attach the authenticated user to any existing invited user record
          try {
            await supabase.rpc('attach_auth_user_to_invited_user');
          } catch (error) {
            console.error('Error attaching user:', error);
          }

          // Check if this is a first-time login requiring onboarding
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_login_completed, force_password_reset')
            .eq('id', session.user.id)
            .single();

          if (!userError && userData && (userData.force_password_reset || !userData.first_login_completed)) {
            setShowOnboarding(true);
            toast({
              title: "Velkommen til AKITA!",
              description: "Udfyld dine oplysninger for at komme i gang",
            });
          } else {
            onLogin(session.user);
            navigate("/app/dashboard");
          }
        } else if (event === 'SIGNED_OUT') {
          navigate("/app/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [onLogin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login fejl",
          description: error.message,
        });
        return;
      }

      if (data.user) {
        // Check if this is first login requiring onboarding
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_login_completed, force_password_reset')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('Error checking user status:', userError);
        }

        if (userData && (userData.force_password_reset || !userData.first_login_completed)) {
          setShowOnboarding(true);
          toast({
            title: "Velkommen!",
            description: "Udfyld dine oplysninger for at komme i gang",
          });
        } else {
          onLogin(data.user);
          toast({
            title: "Velkommen til AKITA!",
            description: "Du er nu logget ind",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login fejl",
        description: "Der opstod en uventet fejl",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (user: any) => {
    setShowOnboarding(false);
    onLogin(user);
  };

  // Show onboarding page if needed
  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md akita-card border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Log ind til AKITA
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Log ind med din email og engangskode/adgangskode
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="din@email.dk"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Adgangskode / Engangskode
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Adgangskode eller engangskode"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Første gang? Brug din 8-tegns engangskode fra invitationsmailen
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full akita-gradient hover:akita-glow akita-transition"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Log ind
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};