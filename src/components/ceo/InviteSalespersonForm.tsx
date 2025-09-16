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
import { Loader2, UserPlus, Mail, User } from "lucide-react";

interface InviteSalespersonFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export const InviteSalespersonForm = ({ organizationId, onSuccess }: InviteSalespersonFormProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
            organizationId,
            role: "salesperson", // Default to salesperson role
            appUrl: window.location.origin,
          },
        }
      );

      if (error) {
        console.error("Error sending invitation:", error);
        const message =
          (error as any)?.message ||
          "Kunne ikke sende invitation. Prøv igen.";
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
          description: message,
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Invitation sendt!",
          description: `${firstName} ${lastName} har modtaget en invitation på ${email}`,
        });

        // Reset form
        setEmail("");
        setFirstName("");
        setLastName("");
        
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
          description: data?.error || "Ukendt fejl opstod",
        });
      }
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        variant: "destructive",
        title: "Fejl ved invitation",
        description: "Der opstod en uventet fejl",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Inviter Sælger
        </CardTitle>
        <CardDescription>
          Send en invitation til en ny sælger i dit team
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
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
                  className="pl-10"
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
                  className="pl-10"
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
                className="pl-10"
                placeholder="sælger@firma.dk"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
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