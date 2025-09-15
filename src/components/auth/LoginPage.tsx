import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mail, Lock, User, Calendar, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  onLogin: (user: any) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        onLogin(session.user);
        navigate("/dashboard");
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          onLogin(session.user);
          navigate("/dashboard");
        } else if (event === 'SIGNED_OUT') {
          navigate("/auth");
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
        onLogin(data.user);
        toast({
          title: "Velkommen til AKITA!",
          description: "Du er nu logget ind",
        });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            birth_date: birthDate,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registrering fejl",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Registrering sendt!",
        description: "Tjek din email for at bekræfte din konto",
      });
      
      setIsLogin(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registrering fejl",
        description: "Der opstod en uventet fejl",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md akita-card border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isLogin ? "Velkommen tilbage" : "Opret konto"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin 
              ? "Log ind til din AKITA konto" 
              : "Tilmeld dig AKITA salgsplatformen"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Fornavn
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 bg-input border-border"
                        placeholder="Fornavn"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Efternavn
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10 bg-input border-border"
                        placeholder="Efternavn"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Telefon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-input border-border"
                      placeholder="Telefonnummer"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="birthDate" className="text-sm font-medium">
                    Fødselsdato
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="pl-10 bg-input border-border"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </>
            )}

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
            </div>

            <Button 
              type="submit" 
              className="w-full akita-gradient hover:akita-glow akita-transition"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLogin ? "Log ind" : "Opret konto"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-primary/80 akita-transition"
            >
              {isLogin 
                ? "Har du ikke en konto? Tilmeld dig her" 
                : "Har du allerede en konto? Log ind her"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};