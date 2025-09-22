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

  // Tjek om brugeren allerede er logget ind
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/app/auth");
        return;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("first_login_completed, force_password_reset")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking user:", error);
        setShowOnboarding(true);
      } else if (!userData || userData.force_password_reset || !userData.first_login_completed) {
        setShowOnboarding(true);
        navigate("/app/onboarding");
      } else {
        onLogin(session.user);
        navigate("/app/dashboard");
      }
    };

    checkSession();

    // Lyt efter auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          try { await supabase.rpc("attach_auth_user_to_invited_user"); } catch {}

          const { data: userData } = await supabase
            .from("users")
            .select("first_login_completed, force_password_reset")
            .eq("id", session.user.id)
            .maybeSingle();

          if (!userData || userData.force_password_reset || !userData.first_login_completed) {
            setShowOnboarding(true);
            navigate("/app/onboarding");
          } else {
            onLogin(session.user);
            navigate("/app/dashboard");
          }
        } else if (event === "SIGNED_OUT") {
          navigate("/app/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, onLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: "destructive", title: "Login fejl", description: error.message });
        return;
      }

      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("first_login_completed, force_password_reset")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!userData || userData.force_password_reset || !userData.first_login_completed) {
          setShowOnboarding(true);
          navigate("/app/onboarding");
        } else {
          onLogin(data.user);
          toast({ title: "Velkommen til AKITA!", description: "Du er nu logget ind" });
          navigate("/app/dashboard");
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Login fejl", description: "Uventet fejl opstod" });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (user: any) => {
    setShowOnboarding(false);
    onLogin(user);
    navigate("/app/dashboard");
  };

  if (showOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-neutral-900">
      <div className="relative z-20 w-full max-w-md flex flex-col items-center">
        <Card className="w-full akita-card border-border">
          <CardHeader className="text-center">
            <div className="w-52 h-52 mx-auto mb-4 mt-8 flex items-center justify-center group">
              <img 
                src="/logoLoginPage.png" 
                alt="Akita logo" 
                className="w-52 h-52 object-contain transition-transform duration-500 group-hover:-translate-y-3 group-hover:scale-105 group-hover:drop-shadow-lg" 
                style={{ willChange: 'transform' }}
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">Log ind til AKITA</CardTitle>
            <CardDescription className="text-muted-foreground">
              Log ind med din email og adgangskode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
                <Label htmlFor="password" className="text-sm font-medium">Adgangskode</Label>
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
                  Første gang? Du skal være inviteret af en administrator. Tjek din e-mail.
                </p>
              </div>
              <Button type="submit" className="w-full akita-gradient hover:akita-glow akita-transition" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log ind
              </Button>
            </form>
          </CardContent>
        </Card>
        <span className="mt-6 text-xs md:text-sm text-white/50 tracking-widest font-semibold">
          With Nordstack by Nordstack
        </span>
      </div>
    </div>
  );
};