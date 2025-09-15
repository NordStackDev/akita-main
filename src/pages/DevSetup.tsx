import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Code, User, CheckCircle } from "lucide-react";

export const DevSetup = () => {
  const [loading, setLoading] = useState(false);
  const [devUserCreated, setDevUserCreated] = useState(false);
  const { toast } = useToast();

  const createDevUser = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-dev-user');

      if (error) {
        console.error('Error creating dev user:', error);
        toast({
          variant: "destructive",
          title: "Fejl ved oprettelse af developer bruger",
          description: error.message,
        });
        return;
      }

      if (data?.success) {
        setDevUserCreated(true);
        toast({
          title: "Developer bruger oprettet!",
          description: "Du kan nu logge ind med emilmh.tc@gmail.com",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved oprettelse",
          description: data?.error || "Ukendt fejl opstod",
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Fejl ved oprettelse",
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
            <Code className="text-2xl font-bold text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            AKITA Developer Setup
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Opsæt developer konto til admin adgang
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!devUserCreated ? (
            <div className="space-y-4">
              <div className="p-4 bg-input rounded-lg">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Developer Bruger Detaljer
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> emilmh.tc@gmail.com</p>
                  <p><strong>Password:</strong> Krj66pgw!</p>
                  <p><strong>Rolle:</strong> Developer (fuld adgang)</p>
                </div>
              </div>

              <Button 
                onClick={createDevUser}
                className="w-full akita-gradient hover:akita-glow akita-transition"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                Opret Developer Bruger
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-2xl font-bold text-green-500 w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Developer bruger oprettet!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Du kan nu gå tilbage til login siden og logge ind med:
                </p>
                <div className="p-3 bg-input rounded-lg text-sm">
                  <p><strong>Email:</strong> emilmh.tc@gmail.com</p>
                  <p><strong>Password:</strong> Krj66pgw!</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = '/app/auth'}
                className="w-full akita-gradient hover:akita-glow akita-transition"
              >
                Gå til Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};