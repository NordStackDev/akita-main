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
import { Loader2, UserPlus, Mail, User, Phone } from "lucide-react";

interface InviteUserFormProps {
  organizationId: string;
  allowedRoles?: string[]; // fx ['admin', 'sales']
}

export const InviteUserForm = ({
  organizationId,
  allowedRoles = ["sales"],
}: InviteUserFormProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();
  const [role, setRole] = useState(allowedRoles[0]);

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
            phone,
            organizationId,
            role,
            appUrl: window.location.origin,
          },
        }
      );

      if (error) {
        console.error("Error sending invitation:", error);
        let details: string | undefined;
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            try {
              const parsed = JSON.parse(txt);
              details = parsed?.error || parsed?.message || txt;
            } catch {
              details = txt;
            }
          } else if ((error as any)?.message) {
            details = (error as any).message;
          }
        } catch {}
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
          description: details || "Kunne ikke sende invitation. Prøv igen.",
        });
        return;
      }

      if (data?.success) {
        if (data?.verifyLink) {
          try { await navigator.clipboard.writeText(data.verifyLink); } catch {}
        }
        toast({
          title: data?.emailSent ? "Invitation sendt!" : "Invitation oprettet",
          description: data?.emailSent
            ? `${firstName} ${lastName} har modtaget en invitation på ${email}`
            : `Email kunne ikke sendes automatisk. Link kopieret: ${data?.verifyLink}`,
        });

        // Reset form
        setEmail("");
        setFirstName("");
        setLastName("");
        setPhone("");
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
          description: data?.error || "Ukendt fejl opstod",
        });
      }
    } catch (error: any) {
      console.error("Error sending invitation:", error);
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
          title: "Fejl ved invitation",
          description: details || "Der opstod en uventet fejl",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
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
          <UserPlus className="w-5 h-5" />
          Inviter ny bruger
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Send en invitation til en ny medarbejder. De får en engangskode på email.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {allowedRoles.length > 1 && (
              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  Rolle
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-input border-border text-foreground"
                  required
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r === "admin" 
                        ? "Administrator" 
                        : r === "sales" 
                        ? "Sælger"
                        : r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                  required
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
                  required
                />
              </div>
            </div>
          </div>

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
                placeholder="navn@email.dk"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Telefon (valgfrit)
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
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Send invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
