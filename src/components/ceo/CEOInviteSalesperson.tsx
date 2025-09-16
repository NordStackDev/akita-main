import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { InviteSalespersonForm } from "./InviteSalespersonForm";
import { 
  UserPlus, 
  Crown, 
  Users,
  TrendingUp,
  Mail,
  CheckCircle,
  Clock
} from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  created_at: string;
  used_at: string | null;
  expires_at: string;
  code: string;
}

interface InvitationStats {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
}

export const CEOInviteSalesperson = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0
  });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitationsData();
  }, []);

  const fetchInvitationsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.organization_id) return;
      setOrganizationId(profile.organization_id);

      // Get all invitations sent by this user
      const { data: invites } = await supabase
        .from("invitation_codes")
        .select("*")
        .eq("created_by_user_id", user.id)
        .order("created_at", { ascending: false });

      if (invites) {
        setInvitations(invites);

        // Calculate stats
        const now = new Date();
        const stats = invites.reduce((acc, invite) => {
          acc.total++;
          
          if (invite.used_at) {
            acc.accepted++;
          } else if (new Date(invite.expires_at) < now) {
            acc.expired++;
          } else {
            acc.pending++;
          }
          
          return acc;
        }, { total: 0, pending: 0, accepted: 0, expired: 0 });

        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching invitations data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente invitations data",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.used_at) {
      return { status: "accepted", label: "Accepteret", color: "text-green-600" };
    }
    
    const now = new Date();
    if (new Date(invitation.expires_at) < now) {
      return { status: "expired", label: "Udløbet", color: "text-red-600" };
    }
    
    return { status: "pending", label: "Afventer", color: "text-yellow-600" };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired":
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Mail className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-blue-500" />
          Inviter Sælger
        </h1>
        <p className="text-muted-foreground">Send invitationer til nye sælgere i dit team</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invitationer</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Sendt i alt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afventer</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Ikke accepteret endnu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepteret</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Tilmeldt succesfuldt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Udløbet</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Ikke brugt i tide</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {organizationId && (
          <InviteSalespersonForm 
            organizationId={organizationId} 
            onSuccess={fetchInvitationsData}
          />
        )}

        {/* Invitation Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Instruktioner
            </CardTitle>
            <CardDescription>
              Sådan inviterer du nye sælgere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Indtast sælgerens information</p>
                  <p className="text-sm text-muted-foreground">
                    Fornavn, efternavn og email adresse
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Send invitation</p>
                  <p className="text-sm text-muted-foreground">
                    Sælgeren modtager en email med instruktioner
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Sælger tilmelder sig</p>
                  <p className="text-sm text-muted-foreground">
                    De opretter deres konto og kan begynde at arbejde
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invitation History */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Historik</CardTitle>
          <CardDescription>Oversigt over alle sendte invitationer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations.length > 0 ? (
              invitations.map((invitation) => {
                const statusInfo = getInvitationStatus(invitation);
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(statusInfo.status)}
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Sendt: {new Date(invitation.created_at).toLocaleDateString("da-DK")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className={`text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </p>
                        {invitation.used_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(invitation.used_at).toLocaleDateString("da-DK")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{invitation.code}</p>
                        <p className="text-xs text-muted-foreground">
                          Udløber: {new Date(invitation.expires_at).toLocaleDateString("da-DK")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen invitationer sendt endnu</p>
                <p className="text-sm text-muted-foreground">
                  Send din første invitation for at komme i gang
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};