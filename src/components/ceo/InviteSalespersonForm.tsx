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
import { useInviteForm } from "@/components/admin/useInviteForm"; 
import { InviteFormFields } from "@/components/admin/InviteFormFields"; 

interface InviteSalespersonFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export const InviteSalespersonForm = ({ organizationId }: InviteSalespersonFormProps) => {
  const {
    loading, email, setEmail, firstName, setFirstName, lastName, setLastName, phone, setPhone, role, setRole, handleInvite
  } = useInviteForm({
    organizationId,
    defaultRole: "sales"
  });

  return (
    <Card className="akita-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <UserPlus className="w-5 h-5 text-primary" />
          Inviter Sælger
        </CardTitle>
        <CardDescription>
          Send en invitation til en ny sælger i dit team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <InviteFormFields
            email={email} setEmail={setEmail}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            phone={phone} setPhone={setPhone}
            role={role} setRole={setRole}
            allowedRoles={['sales']}
            showRole={false}
          />
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