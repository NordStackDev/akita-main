import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Users,
  Calendar,
  RefreshCw,
  Trophy,
  Star
} from "lucide-react";
import { toast } from "sonner";

interface StatsData {
  personalStats: {
    totalSales: number;
    totalPoints: number;
    monthlyPoints: number;
    weeklyPoints: number;
    avgPointsPerSale: number;
    rank: number;
    totalTeamMembers: number;
  };
  teamStats: {
    teamName: string;
    teamTotalPoints: number;
    teamRank: number;
    teamAvgPoints: number;
    topPerformer: string;
  };
  monthlyData: any[];
  weeklyData: any[];
  loading: boolean;
}

export const StatsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    personalStats: {
      totalSales: 0,
      totalPoints: 0,
      monthlyPoints: 0,
      weeklyPoints: 0,
      avgPointsPerSale: 0,
      rank: 0,
      totalTeamMembers: 0,
    },
    teamStats: {
      teamName: '',
      teamTotalPoints: 0,
      teamRank: 0,
      teamAvgPoints: 0,
      topPerformer: '',
    },
    monthlyData: [],
    weeklyData: [],
    loading: true,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Get user's organization and team
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          organization_id,
          user_roles(name, level),
          organizations(name)
        `)
        .eq('user_id', user.id)
        .single();

      // Get personal sales data
      const { data: personalSales } = await supabase
        .from('sales')
        .select('points, amount, created_at')
        .eq('user_id', user.id);

      // Get monthly sales (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const monthlySales = personalSales?.filter(sale => 
        new Date(sale.created_at) >= thirtyDaysAgo
      ) || [];

      // Get weekly sales (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklySales = personalSales?.filter(sale => 
        new Date(sale.created_at) >= sevenDaysAgo
      ) || [];

      // Calculate personal stats
      const totalSales = personalSales?.length || 0;
      const totalPoints = personalSales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;
      const monthlyPoints = monthlySales.reduce((sum, sale) => sum + (sale.points || 0), 0);
      const weeklyPoints = weeklySales.reduce((sum, sale) => sum + (sale.points || 0), 0);
      const avgPointsPerSale = totalSales > 0 ? Math.round(totalPoints / totalSales) : 0;

      // Get all users in organization for ranking
      const { data: orgUsers } = await supabase
        .from('sales')
        .select(`
          user_id,
          points,
          users!inner(organization_id)
        `)
        .eq('users.organization_id', profile?.organization_id);

      // Calculate user rankings
      const userPoints = new Map();
      orgUsers?.forEach(sale => {
        const userId = sale.user_id;
        userPoints.set(userId, (userPoints.get(userId) || 0) + (sale.points || 0));
      });

      const sortedUsers = Array.from(userPoints.entries())
        .sort(([,a], [,b]) => (b as number) - (a as number));
      
      const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

      // Get team data (simplified for now)
      const { data: teamMembers } = await supabase
        .from('users')
        .select(`
          id, first_name, last_name,
          user_roles(name)
        `)
        .eq('organization_id', profile?.organization_id)
        .gte('user_roles.level', 5); // Team members only

      const totalTeamMembers = teamMembers?.length || 0;

      // Mock team stats for now
      const teamStats = {
        teamName: profile?.organizations?.name || 'Dit Team',
        teamTotalPoints: totalPoints * 2, // Mock calculation
        teamRank: Math.max(1, Math.floor(Math.random() * 5) + 1),
        teamAvgPoints: avgPointsPerSale,
        topPerformer: teamMembers?.[0] 
          ? `${teamMembers[0].first_name} ${teamMembers[0].last_name}`
          : 'Dig',
      };

      setStats({
        personalStats: {
          totalSales,
          totalPoints,
          monthlyPoints,
          weeklyPoints,
          avgPointsPerSale,
          rank: userRank,
          totalTeamMembers,
        },
        teamStats,
        monthlyData: monthlySales,
        weeklyData: weeklySales,
        loading: false,
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Fejl ved hentning af statistikker');
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const { personalStats, teamStats, loading } = stats;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Statistikker</h1>
          <p className="text-muted-foreground">Oversigt over dine salg og performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Opdateret: {lastUpdated.toLocaleTimeString('da-DK')}
          </div>
          <Button onClick={fetchStats} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Opdater
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personlige Stats</TabsTrigger>
          <TabsTrigger value="team">Team Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Salg</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={personalStats.totalSales} />
                </div>
                <p className="text-xs text-muted-foreground">Alle dine salg</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={personalStats.totalPoints} />
                </div>
                <p className="text-xs text-muted-foreground">Samlet score</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Månedlige Points</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={personalStats.monthlyPoints} />
                </div>
                <p className="text-xs text-muted-foreground">Sidste 30 dage</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Din Rang</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #{personalStats.rank || '-'}
                </div>
                <p className="text-xs text-muted-foreground">I organisationen</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="akita-card">
              <CardHeader>
                <CardTitle>Ugentlig Performance</CardTitle>
                <CardDescription>Dine points fra de sidste 7 dage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter value={personalStats.weeklyPoints} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Gennemsnit per salg: <AnimatedCounter value={personalStats.avgPointsPerSale} /> points
                </p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader>
                <CardTitle>Performance Mål</CardTitle>
                <CardDescription>Hvor tæt er du på dine mål?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Månedligt mål (100 points)</span>
                    <Badge variant={personalStats.monthlyPoints >= 100 ? "default" : "secondary"}>
                      {Math.round((personalStats.monthlyPoints / 100) * 100)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="akita-gradient h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((personalStats.monthlyPoints / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Størrelse</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={personalStats.totalTeamMembers} />
                </div>
                <p className="text-xs text-muted-foreground">Aktive medlemmer</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Points</CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={teamStats.teamTotalPoints} />
                </div>
                <p className="text-xs text-muted-foreground">Samlet team score</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Rang</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #{teamStats.teamRank}
                </div>
                <p className="text-xs text-muted-foreground">Af alle teams</p>
              </CardContent>
            </Card>

            <Card className="akita-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Star className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate">
                  {teamStats.topPerformer}
                </div>
                <p className="text-xs text-muted-foreground">Bedste i teamet</p>
              </CardContent>
            </Card>
          </div>

          <Card className="akita-card">
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Oversigt over dit team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-input rounded-lg">
                  <div>
                    <h3 className="font-semibold">{teamStats.teamName}</h3>
                    <p className="text-sm text-muted-foreground">Dit teams navn</p>
                  </div>
                  <Badge variant="outline">Aktiv</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-input rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      <AnimatedCounter value={teamStats.teamAvgPoints} />
                    </div>
                    <p className="text-sm text-muted-foreground">Gennemsnit per salg</p>
                  </div>
                  <div className="text-center p-4 bg-input rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      <AnimatedCounter value={personalStats.totalTeamMembers} />
                    </div>
                    <p className="text-sm text-muted-foreground">Team medlemmer</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};