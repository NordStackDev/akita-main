import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useInvitationAcceptance = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleInvitationAcceptance = async () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const type = searchParams.get("type");

      if (!accessToken || !refreshToken || (type !== "invite" && type !== "recovery")) {
        return;
      }

      if (processing) return;
      setProcessing(true);

      try {
        // Set the session with the tokens from the URL
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        const user = sessionData.session?.user;
        if (!user) {
          throw new Error("User not found in session");
        }

        // Get invitation details from user metadata or database
        const invitationCode = user.user_metadata?.invitation_code;
        let invitedRole = user.user_metadata?.role || "sales";
        let invitedOrgId: string | null = null;

        if (invitationCode) {
          // Get invitation details from database
          const { data: invitation } = await supabase
            .from("invitation_codes")
            .select("invited_role, invited_org_id")
            .eq("code", invitationCode)
            .single();

          if (invitation) {
            invitedRole = invitation.invited_role || invitedRole;
            invitedOrgId = invitation.invited_org_id;
          }
        }

        // Assign role and organization
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("id")
          .ilike("name", invitedRole)
          .single();

        if (roleData) {
          await supabase
            .from("users")
            .update({
              role_id: roleData.id,
              organization_id: invitedOrgId,
              force_password_reset: true,
            })
            .eq("id", user.id);

          // Update profile
          await supabase
            .from("profiles")
            .upsert({
              user_id: user.id,
              organization_id: invitedOrgId,
              role_id: roleData.id,
            });
        }

        toast({
          title: "Invitation accepteret",
          description: "Din konto er nu aktiv. Du kan oprette din adgangskode.",
        });

        // Redirect til AkitaApp så onboarding kan begynde
        navigate("/app/dashboard");

      } catch (error: any) {
        console.error("Error processing invitation:", error);
        toast({
          variant: "destructive",
          title: "Fejl ved invitation",
          description: error.message || "Kunne ikke behandle invitation",
        });
      } finally {
        setProcessing(false);
      }
    };

    handleInvitationAcceptance();
  }, [searchParams, processing, toast]);

  return { processing };
};