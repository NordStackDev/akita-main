import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  Crown,
  UserPlus,
  Settings,
  Target,
  Award
} from "lucide-react";
import { InviteSalespersonForm } from "./InviteSalespersonForm";
import { TeamManagement } from "./TeamManagement";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_roles: {
    name: string;
    level: number;
  };
  profiles: {
    profile_image_url?: string;
  };
  sales_count?: number;
  total_points?: number;
}

interface CEOStats {
  totalSales: number;
  totalTeamMembers: number;
  totalPoints: number;
  topPerformer?: TeamMember;
}

export const CEODashboard = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<CEOStats>({
    totalSales: 0,
    totalTeamMembers: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCEOData();
  }, []);

  const fetchCEOData = async () => {
    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.organization_id) return;
      setOrganizationId(profile.organization_id);

      // Get team members from the same organization
      const { data: members } = await supabase
        .from("users")
        .select(`
          id,
          first_name,
          last_name,
          email,
          user_roles!inner (
            name,
            level
          ),
          profiles (
            profile_image_url
          )
        `)
        .eq("organization_id", profile.organization_id)
        .gte("user_roles.level", 5) // Team lead level and below (excluding admin levels)
        .order("user_roles.level", { ascending: true });

      if (members) {
        // Get sales data for each member
        const membersWithStats = await Promise.all(
          members.map(async (member) => {
            const { data: sales } = await supabase
              .from("sales")
              .select("points")
              .eq("user_id", member.id);

            const salesCount = sales?.length || 0;
            const totalPoints = sales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;

            return {
              ...member,
              sales_count: salesCount,
              total_points: totalPoints
            };
          })
        );

        setTeamMembers(membersWithStats);

        // Calculate stats
        const totalSales = membersWithStats.reduce((sum, member) => sum + (member.sales_count || 0), 0);
        const totalPoints = membersWithStats.reduce((sum, member) => sum + (member.total_points || 0), 0);
        const topPerformer = membersWithStats.reduce((top, current) => 
          (current.total_points || 0) > (top?.total_points || 0) ? current : top
        );

        setStats({
          totalSales,
          totalTeamMembers: membersWithStats.length,
          totalPoints,
          topPerformer
        });
      }
    } catch (error) {
      console.error("Error fetching CEO data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente team data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role_id: newRoleId })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Rolle opdateret",
        description: "Brugerens rolle er blevet opdateret",
      });

      // Refresh data
      fetchCEOData();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke opdatere rolle",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            CEO Dashboard
          </h1>
          <p className="text-muted-foreground">Oversigt over dit team og forretning</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salg</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Fra alle sælgere</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Medlemmer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">Aktive sælgere</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <p className="text-xs text-muted-foreground">Fra alle salg</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats.topPerformer ? 
                `${stats.topPerformer.first_name} ${stats.topPerformer.last_name}` : 
                "Ingen data"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topPerformer?.total_points || 0} points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Salesperson */}
      {organizationId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InviteSalespersonForm 
            organizationId={organizationId} 
            onSuccess={fetchCEOData}
          />
          <TeamManagement 
            teamMembers={teamMembers}
            onRoleChange={handleRoleChange}
          />
        </div>
      )}

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Oversigt</CardTitle>
          <CardDescription>Se alle dine team medlemmer og deres præstation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.profile_image_url} />
                      <AvatarFallback>
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold">{member.sales_count}</p>
                      <p className="text-xs text-muted-foreground">Salg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{member.total_points}</p>
                      <p className="text-xs text-muted-foreground">Points</p>
                    </div>
                    <Badge variant="secondary">
                      {member.user_roles.name}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen team medlemmer endnu</p>
                <p className="text-sm text-muted-foreground">Inviter dine første sælgere for at komme i gang</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};