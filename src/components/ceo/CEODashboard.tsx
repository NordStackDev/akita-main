import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackgroundGradient } from "@/components/ui/background-gradient";
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
  Award,
  Building,
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

interface CompanyInfo {
  id: string;
  name: string;
  organizations: {
    id: string;
    name: string;
  }[];
}

export const CEODashboard = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<CEOStats>({
    totalSales: 0,
    totalTeamMembers: 0,
    totalPoints: 0,
  });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userName, setUserName] = useState<string>("Bruger");

  useEffect(() => {
    fetchCEOData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    // Get user from auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("profile_image_url, user_id")
      .eq("user_id", user?.id)
      .single();
    setUserProfile(profile);
    // Get userRow
    const { data: userRow } = await supabase
      .from("users")
      .select("first_name, last_name, name")
      .eq("id", user?.id)
      .single();
    setUserInfo(userRow || null);
    const name =
      userRow?.first_name ||
      userRow?.name ||
      user?.email?.split("@")[0] ||
      "Bruger";
    setUserName(name);
  };
  const fetchCEOData = async () => {
    try {
      // Get current user's organization
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          organization_id,
          organizations (
            id,
            name,
            company_id
          )
        `
        )
        .eq("user_id", user.id)
        .single();

      if (!profile?.organization_id) return;
      setOrganizationId(profile.organization_id);

      // Get company and all its organizations
      if (profile.organizations?.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select(
            `
            id,
            name,
            organizations (
              id,
              name
            )
          `
          )
          .eq("id", profile.organizations.company_id)
          .single();

        if (company) {
          setCompanyInfo(company);
        }
      }

      // Get team members from the same organization
      const { data: members } = await supabase
        .from("users")
        .select(
          `
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
        `
        )
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
            const totalPoints =
              sales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;

            return {
              ...member,
              sales_count: salesCount,
              total_points: totalPoints,
            };
          })
        );

        setTeamMembers(membersWithStats);

        // Calculate stats
        const totalSales = membersWithStats.reduce(
          (sum, member) => sum + (member.sales_count || 0),
          0
        );
        const totalPoints = membersWithStats.reduce(
          (sum, member) => sum + (member.total_points || 0),
          0
        );
        const topPerformer = membersWithStats.reduce((top, current) =>
          (current.total_points || 0) > (top?.total_points || 0) ? current : top
        );

        setStats({
          totalSales,
          totalTeamMembers: membersWithStats.length,
          totalPoints,
          topPerformer,
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
      {/* Header - genbrugt fra Dashboard */}
      <div className="mb-8">
        <div className="mb-4">
          <BackgroundGradient className="rounded-2xl overflow-hidden shadow-lg p-0">
            <div className="relative">
              <div className="absolute inset-0 z-0"></div>
              <div className="relative flex items-center gap-4 px-8 py-7 z-10">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-white">
                  <Avatar className="h-14 w-14">
                    <AvatarImage
                      src={userProfile?.profile_image_url || undefined}
                    />
                    <AvatarFallback className="text-2xl font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1 drop-shadow">
                    Velkommen tilbage, {userName}!
                  </h1>
                  <span className="text-white/90 text-lg font-medium drop-shadow">
                    Vi håber du får en fantastisk dag på AKITA
                  </span>
                  {companyInfo?.name && (
                    <span className="flex items-center gap-2 mt-1 text-yellow-200 text-base font-semibold drop-shadow">
                      <Crown className="inline w-5 h-5 text-yellow-400" />
                      Du er ejer af{""}
                      <span className="font-bold">{companyInfo.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </BackgroundGradient>
        </div>
        <p className="text-muted-foreground text-base ml-1">
          Her er dit dashboard med dagens muligheder
        </p>
      </div>

      {/* Company & Organizations Overview */}
      {companyInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Virksomhed</CardTitle>
              <CardDescription>Din virksomheds information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{companyInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {companyInfo.organizations?.length || 0} organisationer
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organisationer</CardTitle>
              <CardDescription>
                Alle organisationer i virksomheden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {companyInfo.organizations?.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded"
                  >
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm">{org.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <CardTitle className="text-sm font-medium">
              Team Medlemmer
            </CardTitle>
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
              {stats.topPerformer
                ? `${stats.topPerformer.first_name} ${stats.topPerformer.last_name}`
                : "Ingen data"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topPerformer?.total_points || 0} points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* InviteSalespersonForm og TeamManagement fjernet fra dashboardet. Tilgås nu kun via routes/nav. */}

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Oversigt</CardTitle>
          <CardDescription>
            Se alle dine team medlemmer og deres præstation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.profile_image_url} />
                      <AvatarFallback>
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                      </p>
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
                    <Badge variant="secondary">{member.user_roles.name}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Ingen team medlemmer endnu
                </p>
                <p className="text-sm text-muted-foreground">
                  Inviter dine første sælgere for at komme i gang
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
