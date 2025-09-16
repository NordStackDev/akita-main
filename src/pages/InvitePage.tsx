import React, { useEffect, useState } from "react";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { InviteCEOForm } from "@/components/admin/InviteCEOForm";
import { supabase } from "@/integrations/supabase/client";

const InvitePage = () => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile?.organization_id) {
            setOrganizationId(profile.organization_id);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Inviter bruger eller CEO</h1>
      {loading ? (
        <p>Indlæser organisation...</p>
      ) : organizationId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InviteUserForm organizationId={organizationId} allowedRoles={["admin", "sales"]} />
          <InviteCEOForm organizationId={organizationId} />
        </div>
      ) : (
        <p>Ingen organisation fundet for din bruger. Kontakt en administrator.</p>
      )}
    </div>
  );
};

export default InvitePage;
