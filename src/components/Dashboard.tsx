import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp, 
  MapPin, 
  ShoppingCart,
  Calendar,
  Award,
  MessageSquare
} from "lucide-react";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardData {
  salesCount: number;
  totalPoints: number;
  teamRank: number;
  weeklyTarget: number;
  recentSales: any[];
  userProfile: any;
  isAdmin: boolean;
  organizationId: string | null;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    salesCount: 0,
    totalPoints: 0,
    teamRank: 0,
    weeklyTarget: 100,
    recentSales: [],
    userProfile: null,
    isAdmin: false,
    organizationId: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile with role and organization info
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            name,
            level
          ),
          organizations (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .single();

      // Check if user is admin (level <= 2)
      const isAdmin = profile?.user_roles?.level <= 2;
      const organizationId = profile?.organization_id;

      // Fetch user's sales
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          customers (first_name, last_name),
          products (name, points_value)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalPoints = sales?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;
      const salesCount = sales?.length || 0;

      setDashboardData({
        salesCount,
        totalPoints,
        teamRank: Math.floor(Math.random() * 10) + 1, // Mock data for now
        weeklyTarget: 100,
        recentSales: sales || [],
        userProfile: profile,
        isAdmin,
        organizationId
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Ny Salg",
      description: "Registrer et nyt salg",
      icon: ShoppingCart,
      color: "akita-gradient",
      href: "/sales/new"
    },
    {
      title: "Vælg Lokation",
      description: "Vælg din arbejdsplads",
      icon: MapPin,
      color: "bg-secondary",
      href: "/locations"
    },
    {
      title: "Statistikker",
      description: "Se dine resultater",
      icon: BarChart3,
      color: "bg-secondary",
      href: "/stats"
    },
    {
      title: "Team",
      description: "Se dit teams præstation",
      icon: Users,
      color: "bg-secondary",
      href: "/team"
    }
  ];

  const userName = dashboardData.userProfile?.user?.name || 
                   user.user_metadata?.first_name || 
                   user.email?.split('@')[0] || 
                   'Bruger';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground">Indlæser dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout user={user} onLogout={onLogout}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Velkommen, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Her er dit dashboard med dagens muligheder
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="akita-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Salg denne uge
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dashboardData.salesCount}</div>
              <p className="text-xs text-muted-foreground">
                Mål: {dashboardData.weeklyTarget}
              </p>
            </CardContent>
          </Card>

          <Card className="akita-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Point i alt
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{dashboardData.totalPoints}</div>
              <p className="text-xs text-muted-foreground">
                +12% fra sidste uge
              </p>
            </CardContent>
          </Card>

          <Card className="akita-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team placering
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">#{dashboardData.teamRank}</div>
              <p className="text-xs text-muted-foreground">
                Af {10} sælgere
              </p>
            </CardContent>
          </Card>

          <Card className="akita-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mål opfyldelse
              </CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((dashboardData.salesCount / dashboardData.weeklyTarget) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Ugens mål
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Hurtige handlinger</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="akita-card border-border hover:akita-glow akita-transition cursor-pointer">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Section */}
        {dashboardData.isAdmin && dashboardData.organizationId && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Admin funktioner</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InviteUserForm organizationId={dashboardData.organizationId} />
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="akita-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Seneste salg</CardTitle>
              <CardDescription>Dine nyeste salgsresultater</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData.recentSales.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentSales.map((sale, index) => (
                    <div key={sale.id || index} className="flex items-center justify-between p-3 bg-input rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">
                          {sale.customers?.first_name} {sale.customers?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sale.products?.name} • {sale.points || 0} point
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('da-DK')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ingen salg endnu</p>
                  <Button className="mt-4 akita-gradient">
                    Registrer dit første salg
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="akita-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Dagens aktiviteter</CardTitle>
              <CardDescription>Kommende møder og deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-input rounded-lg">
                  <Calendar className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="font-medium text-foreground">Team møde</p>
                    <p className="text-sm text-muted-foreground">10:00 - Kontoret</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-input rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary mr-3" />
                  <div>
                    <p className="font-medium text-foreground">Træning session</p>
                    <p className="text-sm text-muted-foreground">14:00 - Online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};