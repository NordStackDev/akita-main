import "./waves.css";
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
import "./waves.css";

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
          .maybeSingle();

        if (userError) {
          console.error('Error checking user status:', userError);
          setShowOnboarding(true);
        } else if (!userData || userData.force_password_reset || !userData.first_login_completed) {
          setShowOnboarding(true);
        } else {
          onLogin(session.user);
          navigate("/app/dashboard");
        }
      }
    };
    
    checkUser();

    // If redirected from email verification (invite/signup/recovery), force onboarding
    (async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#','?'));
        const type = hashParams.get('type');
        if (type === 'signup' || type === 'recovery' || type === 'invite') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setShowOnboarding(true);
        }
      } catch {}
    })();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Try to attach the authenticated user to any existing invited user record
          try {
            await supabase.rpc('attach_auth_user_to_invited_user');
          } catch (error) {
            // fejl ved attach_auth_user_to_invited_user ignoreres
          }

          // Check if this is a first-time login requiring onboarding
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('first_login_completed, force_password_reset')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userError || !userData || userData.force_password_reset || !userData.first_login_completed) {
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
          .maybeSingle();

        if (userError) {
          console.error('Error checking user status:', userError);
        }

        if (!userData || userData.force_password_reset || !userData.first_login_completed) {
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
    <div className="min-h-screen flex items-center justify-center relative bg-neutral-900">
      {/* Watermark fjernet – kun tekst under kortet */}
      <div className="relative z-20 w-full max-w-md flex flex-col items-center">
        <Card className="w-full akita-card border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl  flex items-center justify-center">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Log ind til AKITA
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Log ind med din email og adgangskode.
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
                  Adgangskode
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input border-border"
                    placeholder="Adgangskode"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Første gang? Du skal være inviteret af en administrator, hvis dette er gennemført tjek gerne din e-mail.
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
        <span className="mt-6 text-xs md:text-sm text-white/50 tracking-widest font-semibold">With Nordstack by Nordstack</span>
      </div>
    </div>
  );
}