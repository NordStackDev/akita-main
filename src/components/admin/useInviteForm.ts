import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function useInviteForm({ organizationId, defaultRole }: { organizationId: string; defaultRole: string }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const reset = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setRole(defaultRole);
  };

  const handleInvite = async (e: React.FormEvent, extraFields: Record<string, any> = {}) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Ikke autoriseret", description: "Du skal være logget ind for at sende invitationer" });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: email.toLowerCase(),
          firstName,
          lastName,
          phone,
          organizationId,
          role,
          appUrl: window.location.origin,
          ...extraFields,
        },
      });
      if (error) {
        toast({ variant: "destructive", title: "Fejl ved invitation", description: error.message || "Ukendt fejl" });
      } else {
        toast({ title: "Invitation sendt!", description: `Invitation sendt til ${email}` });
        reset();
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Fejl ved invitation", description: "Uventet fejl" });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    email, setEmail,
    firstName, setFirstName,
    lastName, setLastName,
    phone, setPhone,
    role, setRole,
    handleInvite,
    reset,
  };
}
