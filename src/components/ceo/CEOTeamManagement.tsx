import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Crown, 
  Settings, 
  Trophy,
  TrendingUp,
  Target
} from "lucide-react";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
  user_roles: {
    id: string;
    name: string;
    level: number;
  };
  profiles: {
    profile_image_url?: string;
  };
  sales_count?: number;
  total_points?: number;
}

interface UserRole {
  id: string;
  name: string;
  level: number;
}

export const CEOTeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
    fetchAvailableRoles();
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
          role_id,
          user_roles!inner (
            id,
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

  const fetchAvailableRoles = async () => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("id, name, level")
        .gte("level", 5) // Only roles from team lead and below
        .lte("level", 8) // Exclude developer and CEO roles
        .order("level", { ascending: true });

      if (roles) {
        setAvailableRoles(roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedMember || !selectedRole) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role_id: selectedRole })
        .eq("id", selectedMember);

      if (error) throw error;

      // Also update the profile
      await supabase
        .from("profiles")
        .update({ role_id: selectedRole })
        .eq("user_id", selectedMember);

      toast({
        title: "Rolle opdateret",
        description: "Brugerens rolle er blevet opdateret",
      });

      // Refresh data
      fetchTeamData();
      setSelectedMember(null);
      setSelectedRole("");
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke opdatere rolle",
      });
    }
  };

  const getRoleColor = (level: number) => {
    if (level <= 5) return "bg-purple-500";
    if (level <= 6) return "bg-blue-500";
    if (level <= 7) return "bg-green-500";
    return "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          Team Management
        </h1>
        <p className="text-muted-foreground">Administrer dit team og opdater roller</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Medlemmer</CardTitle>
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

      {/* Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Rolle Management
          </CardTitle>
          <CardDescription>
            Opdater roller for dine team medlemmer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vælg team medlem
              </label>
              <Select value={selectedMember || ""} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en person" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.profiles?.profile_image_url} />
                          <AvatarFallback className="text-xs">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {member.first_name} {member.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Vælg ny rolle
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en rolle" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${getRoleColor(role.level)}`}
                        />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleRoleUpdate} 
                disabled={!selectedMember || !selectedRole}
                className="w-full"
              >
                Opdater Rolle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Team Oversigt
          </CardTitle>
          <CardDescription>Alle team medlemmer og deres præstation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
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