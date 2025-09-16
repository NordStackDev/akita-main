import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { InviteUserForm } from "@/components/admin/InviteUserForm";
// import { InviteCEOForm } from "@/components/admin/InviteCEOForm";
import { useToast } from "@/components/ui/use-toast";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserPlus,
  Crown,
  Building,
  Settings,
} from "lucide-react";

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    profile: null,
    organizationId: null,
    totalUsers: 0,
    activeUsers: 0,
    pendingInvitations: 0,
    recentUsers: [],
    organizations: [],
  });

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      // Get admin profile
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user_roles (name, level),
          organizations (id, name)
        `
        )
        .eq("user_id", user.id)
        .single();

      const organizationId = profile?.organization_id;

      // Get user statistics
      const { data: users } = await supabase
        .from("users")
        .select("id, first_name, last_name, status, created_at")
        .eq("organization_id", organizationId);

      const { data: invitations } = await supabase
        .from("invitation_codes")
        .select("*")
        .is("used_at", null);

      const { data: recentUsers } = await supabase
        .from("users")
        .select(
          `
          id, first_name, last_name, created_at, status,
          user_roles (name)
        `
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5);

      const totalUsers = users?.length || 0;
      const activeUsers =
        users?.filter((u) => u.status === "active").length || 0;
      const pendingInvitations = invitations?.length || 0;

      setAdminData({
        profile,
        organizationId,
        totalUsers,
        activeUsers,
        pendingInvitations,
        recentUsers: recentUsers || [],
        organizations: profile?.organizations ? [profile.organizations] : [],
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente admin data",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground">Indlæser admin panel...</p>
        </div>
      </div>
    );
  }

  const adminName =
    user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Admin";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <BackgroundGradient className="rounded-2xl overflow-hidden shadow-lg p-0">
            <div className="relative">
              <div className="absolute inset-0 z-0"></div>
              <div className="relative flex items-center gap-4 px-8 py-7 z-10">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-white">
                  <Avatar className="h-14 w-14">
                    <AvatarImage
                      src={adminData.profile?.profile_image_url || undefined}
                    />
                    <AvatarFallback className="text-2xl font-bold">
                      {adminName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 drop-shadow">
                    Admin Panel - {adminName}
                  </h1>
                  <span className="text-white/90 text-lg font-medium drop-shadow">
                    Administrer brugere og organisationer på AKITA
                  </span>
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="akita-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totale brugere
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminData.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">I organisationen</p>
          </CardContent>
        </Card>

        <Card className="akita-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive brugere
            </CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminData.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Af {adminData.totalUsers} brugere
            </p>
          </CardContent>
        </Card>

        <Card className="akita-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventende invitationer
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {adminData.pendingInvitations}
            </div>
            <p className="text-xs text-muted-foreground">Afventer svar</p>
          </CardContent>
        </Card>

        <Card className="akita-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Din rolle
            </CardTitle>
            <Settings className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              <Badge variant="secondary" className="text-sm">
                {adminData.profile?.user_roles?.name || "Admin"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Level {adminData.profile?.user_roles?.level || 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invitation forms er nu flyttet til dedikerede admin-sider */}

      {/* Recent Users & Organization Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="akita-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Seneste brugere</CardTitle>
            <CardDescription>Nyligt oprettede brugere</CardDescription>
          </CardHeader>
          <CardContent>
            {adminData.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {adminData.recentUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="flex items-center justify-between p-3 bg-input rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {user.first_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.user_roles?.name || "Bruger"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {user.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(user.created_at).toLocaleDateString("da-DK")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen brugere endnu</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="akita-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Organisation</CardTitle>
            <CardDescription>Information om din organisation</CardDescription>
          </CardHeader>
          <CardContent>
            {adminData.organizations.length > 0 ? (
              <div className="space-y-4">
                {adminData.organizations.map((org, index) => (
                  <div
                    key={org.id || index}
                    className="flex items-center p-3 bg-input rounded-lg"
                  >
                    <Building className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Organisation ID: {org.id?.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Ingen organisation fundet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
