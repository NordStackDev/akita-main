import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crown, Building } from "lucide-react";
import { useInviteForm } from "../admin/useInviteForm";
import { InviteFormFields } from "../admin/InviteFormFields";

interface InviteCEOFormProps {
  organizationId: string;
}

export const InviteCEOForm = ({ organizationId }: InviteCEOFormProps) => {
  const [companyName, setCompanyName] = useState("");
  const {
    loading, email, setEmail, firstName, setFirstName, lastName, setLastName, phone, setPhone, role, setRole, handleInvite
  } = useInviteForm({
    organizationId,
    defaultRole: "ceo"
  });

  return (
    <Card className="akita-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Crown className="w-5 h-5 text-yellow-500" />
          Inviter CEO
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Send en invitation til en CEO. De får mulighed for at oprette deres organisation.
        </CardDescription>
      </CardHeader>
      <CardContent>
  <form onSubmit={e => handleInvite(e, { companyName, role: 'ceo' })} className="space-y-4">
          <InviteFormFields
            email={email} setEmail={setEmail}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            phone={phone} setPhone={setPhone}
            role={role} setRole={setRole}
            allowedRoles={['ceo']}
            showRole={false}
          />
          <div>
            <label htmlFor="ceoCompanyName" className="text-sm font-medium">
              Firmanavn (valgfrit)
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                id="ceoCompanyName"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="pl-10 bg-input border-border w-full rounded border px-3 py-2"
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
