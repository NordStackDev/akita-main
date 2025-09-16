import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Crown, Mail, User, Building } from "lucide-react";

interface InviteCEOFormProps {
  organizationId: string;
}

export const InviteCEOForm = ({ organizationId }: InviteCEOFormProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Ikke autoriseret",
          description: "Du skal være logget ind for at sende invitationer",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "send-invitation",
        {
          body: {
            email: email.toLowerCase(),
            firstName,
            lastName,
            companyName,
            organizationId,
            role: "ceo",
            appUrl: window.location.origin,
          },
        }
      );

      if (error) {
        console.error("Error sending CEO invitation:", error);
        const message =
          (error as any)?.message ||
          "Kunne ikke sende CEO invitation. Prøv igen.";
        toast({
          variant: "destructive",
          title: "Fejl ved CEO invitation",
          description: message,
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "CEO invitation sendt!",
          description: `${firstName} ${lastName} har modtaget en CEO invitation på ${email}`,
        });

        // Reset form
        setEmail("");
        setFirstName("");
        setLastName("");
        setCompanyName("");
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved CEO invitation",
          description: data?.error || "Ukendt fejl opstod",
        });
      }
    } catch (error: any) {
      console.error("Error sending CEO invitation:", error);
      try {
        const ctx = (error as any)?.context;
        let details: string | undefined;
        if (ctx && typeof ctx.text === "function") {
          details = await ctx.text();
        } else if ((error as any)?.message) {
          details = (error as any).message;
        }
        toast({
          variant: "destructive",
          title: "Fejl ved CEO invitation",
          description: details || "Der opstod en uventet fejl",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Fejl ved CEO invitation",
          description: "Der opstod en uventet fejl",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="akita-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Crown className="w-5 h-5 text-yellow-500" />
          Inviter CEO
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Send en invitation til en CEO. De får mulighed for at oprette deres
          organisation.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ceoFirstName" className="text-sm font-medium">
                Fornavn
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ceoFirstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Fornavn"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ceoLastName" className="text-sm font-medium">
                Efternavn
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ceoLastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Efternavn"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="ceoEmail" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="ceoEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input border-border"
                placeholder="ceo@firma.dk"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ceoCompanyName" className="text-sm font-medium">
              Firmanavn (valgfrit)
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="ceoCompanyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10 bg-input border-border"
                placeholder="Firmanavn"
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
            ) : (
              <Crown className="mr-2 h-4 w-4" />
            )}
            Send CEO invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
