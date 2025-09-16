import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Users, Trophy, Target, TrendingUp } from "lucide-react";

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

export const TeamPage = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.organization_id) return;

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
        .gte("user_roles.level", 5) // Team lead level and below
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

        // Sort by total points (descending)
        membersWithStats.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
        setTeamMembers(membersWithStats);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente team data",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Team Oversigt
        </h1>
        <p className="text-muted-foreground">
          Se dit teams præstation og rangeringer
        </p>
      </div>

      {teamMembers.length > 0 ? (
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Medlemmer</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <p className="text-xs text-muted-foreground">Aktive sælgere</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salg</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamMembers.reduce((sum, member) => sum + (member.sales_count || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Fra alle medlemmer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamMembers.reduce((sum, member) => sum + (member.total_points || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">Samlet resultat</p>
              </CardContent>
            </Card>
          </div>

          {/* Team Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Team Rangeringer
              </CardTitle>
              <CardDescription>Sorteret efter point</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      index === 0 ? 'bg-yellow-50 border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border-gray-200' :
                      index === 2 ? 'bg-orange-50 border-orange-200' :
                      'bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
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
                      <Badge 
                        variant={
                          member.user_roles.level <= 5 ? "default" :
                          member.user_roles.level <= 6 ? "secondary" : "outline"
                        }
                      >
                        {member.user_roles.name}
                      </Badge>
                      {index < 3 && (
                        <Trophy 
                          className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-400'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen team medlemmer fundet</p>
            <p className="text-sm text-muted-foreground">
              Kontakt din admin for at blive tilføjet til et team
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};