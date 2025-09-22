import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, TrendingUp, Calendar, MapPin, Eye, Phone, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

// No props needed - user data comes from context
interface SalespersonData {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  role_id: string;
  created_at: string;
  profiles?: {
    profile_image_url: string;
  };
  user_roles?: {
    name: string;
    level: number;
  };
  totalSales?: number;
  monthSales?: number;
  weekSales?: number;
}

export const TrackingPage = () => {
  const [loading, setLoading] = useState(false);
  const [salespeople, setSalespeople] = useState<SalespersonData[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<SalespersonData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSalespeople();
  }, [user]);

  const loadSalespeople = async () => {
    setLoading(true);
    try {
      // Get current user's role level to determine who they can track
      const { data: userRole, error: roleError } = await supabase
        .from('users')
        .select(`
          role_id,
          user_roles!inner(level, name)
        `)
        .eq('id', user!.id)
        .single();

      if (roleError) throw roleError;

      // Only allow tracking if user is teamlead or higher (level <= 5) or developer
      if (userRole.user_roles.level > 5 && userRole.user_roles.name !== 'developer') {
        toast({
          variant: "destructive",
          title: "Ingen tilladelse",
          description: "Du har ikke tilladelse til at se denne side.",
        });
        return;
      }

      // Fetch salespeople (role level 6 and above) in the same organization
      const { data: people, error: peopleError } = await supabase
        .from('users')
        .select(`
          *,
          profiles(profile_image_url),
          user_roles!inner(name, level)
        `)
        .eq('organization_id', await getUserOrganizationId())
        .order('created_at', { ascending: false });

      if (peopleError) throw peopleError;

      const filteredPeople = (people || []).filter(p => p.user_roles?.level >= 6);

      // Load sales statistics for each person
      const peopleWithStats = await Promise.all(
        filteredPeople.map(async (person) => {
          const { data: salesStats } = await supabase
            .from('sales')
            .select('points, date')
            .eq('user_id', person.id);

          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const totalSales = salesStats?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;
          const monthSales = salesStats?.filter(sale => new Date(sale.date) >= thisMonth)
            .reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;
          const weekSales = salesStats?.filter(sale => new Date(sale.date) >= thisWeek)
            .reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;

          return {
            ...person,
            totalSales,
            monthSales,
            weekSales
          };
        })
      );

      setSalespeople(peopleWithStats);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning",
        description: "Kunne ikke indlæse sælgere",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserOrganizationId = async () => {
    const { data } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user!.id)
      .single();
    return data?.organization_id;
  };

  const filteredSalespeople = salespeople.filter(person =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 akita-gradient rounded-xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-muted-foreground">Indlæser sælgere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8" />
            Sælger Tracking
          </h1>
          <p className="text-muted-foreground">Følg dine sælgeres performance og aktivitet</p>
        </div>

        <div className="mb-6">
          <Label htmlFor="search" className="text-sm font-medium">
            Søg sælgere
          </Label>
          <Input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-input border-border"
            placeholder="Søg efter navn eller email..."
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Oversigt</TabsTrigger>
            <TabsTrigger value="detailed">Detaljeret visning</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSalespeople.map((person) => (
                <Card key={person.id} className="akita-card border-border hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={person.profiles?.profile_image_url} />
                          <AvatarFallback>
                            {person.first_name?.[0]}{person.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{person.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {person.user_roles?.name}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(person.status)}>
                        {person.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total point</span>
                        <span className="font-semibold">{person.totalSales}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Denne måned</span>
                        <span className="font-semibold text-green-600">{person.monthSales}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Denne uge</span>
                        <span className="font-semibold text-blue-600">{person.weekSales}</span>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{person.email}</span>
                        </div>
                        {person.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Phone className="w-4 h-4" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <Card className="akita-card border-border">
              <CardHeader>
                <CardTitle>Detaljeret Performance</CardTitle>
                <CardDescription>
                  Klik på en sælger for at se detaljerede statistikker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredSalespeople.map((person) => (
                    <div 
                      key={person.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedPerson(person)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={person.profiles?.profile_image_url} />
                            <AvatarFallback>
                              {person.first_name?.[0]}{person.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{person.name}</h3>
                            <p className="text-sm text-muted-foreground">{person.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{person.totalSales}</div>
                            <div className="text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{person.monthSales}</div>
                            <div className="text-muted-foreground">Måned</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{person.weekSales}</div>
                            <div className="text-muted-foreground">Uge</div>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {filteredSalespeople.length === 0 && (
          <Card className="akita-card border-border">
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen sælgere fundet</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Prøv at ændre din søgning" : "Der er ingen sælgere at vise"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};