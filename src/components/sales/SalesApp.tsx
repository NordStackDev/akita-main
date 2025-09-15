import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, MapPin, Trophy, Target, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { User } from '@supabase/supabase-js';

interface UserData {
  first_name?: string;
  last_name?: string;
}

interface SalesAppProps {
  user: User;
  onLogout: () => void;
}

interface Location {
  id: string;
  name: string;
  city?: string;
}

interface TopSeller {
  name: string;
  points: number;
  rank: number;
}

export const SalesApp = ({ user, onLogout }: SalesAppProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userData, setUserData] = useState<UserData>({});
  const [monthlyWinner, setMonthlyWinner] = useState<{ name: string; points: number } | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      // Load user data
      const { data: userDataResult, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error loading user data:', userError);
      } else {
        setUserData(userDataResult || {});
      }

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, city');

      if (locationsError) {
        console.error('Error loading locations:', locationsError);
      } else {
        setLocations(locationsData || []);
      }

      // Load user points (sum of sales points)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('points')
        .eq('user_id', user.id);

      if (salesError) {
        console.error('Error loading user points:', salesError);
      } else {
        const totalPoints = salesData?.reduce((sum, sale) => sum + (sale.points || 0), 0) || 0;
        setUserPoints(totalPoints);
      }

      // Load monthly winner and top sellers
      const { data: topSellersData, error: topSellersError } = await supabase
        .from('sales')
        .select(`
          points,
          users!inner(first_name, last_name)
        `)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .order('points', { ascending: false })
        .limit(10);

      if (topSellersError) {
        console.error('Error loading top sellers:', topSellersError);
      } else if (topSellersData && topSellersData.length > 0) {
        // Group by user and sum points
        const userPointsMap = new Map();
        topSellersData.forEach((sale: any) => {
          const userName = `${sale.users.first_name || ''} ${sale.users.last_name || ''}`.trim();
          const currentPoints = userPointsMap.get(userName) || 0;
          userPointsMap.set(userName, currentPoints + (sale.points || 0));
        });

        // Convert to array and sort
        const sortedSellers = Array.from(userPointsMap.entries())
          .map(([name, points], index) => ({ name, points: points as number, rank: index + 1 }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 3);

        setTopSellers(sortedSellers);
        if (sortedSellers.length > 0) {
          setMonthlyWinner({ name: sortedSellers[0].name, points: sortedSellers[0].points });
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Fejl ved indlæsning",
        description: "Kunne ikke indlæse data",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold akita-gradient bg-clip-text text-transparent">
            Akita
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Menu Dropdown */}
      {showMenu && (
        <div className="bg-card border-b border-border p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
            Log ud
          </Button>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Location Selector */}
        <Card className="akita-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Vælg lokation" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.city ? `(${location.city})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Competition Section */}
        <div>
          <h2 className="text-xl font-bold text-destructive mb-3">Konkurrence</h2>
          <Card className="akita-card bg-muted/30">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground">
                Opnå <span className="font-bold text-destructive">100 Points</span>
              </p>
              <p className="text-muted-foreground text-sm">
                og
              </p>
              <p className="text-muted-foreground">
                <span className="font-bold text-destructive">Vind en Booster</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Seller */}
        <div>
          <h2 className="text-xl font-bold text-destructive mb-3">Månedens Sælger</h2>
          <Card className="akita-card">
            <CardContent className="p-6 text-center">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="bg-muted text-2xl">
                  {monthlyWinner?.name.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg mb-1">
                {monthlyWinner?.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Bruger'}
              </h3>
              <div className="border-t border-border pt-2 mt-2">
                <p className="text-2xl font-bold text-destructive">
                  {monthlyWinner?.points || userPoints} - Points
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Best */}
        <div>
          <h2 className="text-xl font-bold text-destructive mb-3">Top 3 bedste</h2>
          <div className="space-y-3">
            {/* Header Row */}
            <div className="bg-destructive text-white p-3 rounded-t-lg grid grid-cols-3 text-center font-bold">
              <span>Navn</span>
              <span>Antal</span>
              <span>Points</span>
            </div>
            
            {/* Top Sellers Rows */}
            {topSellers.slice(0, 3).map((seller, index) => (
              <div key={index} className="bg-card border border-border p-3 grid grid-cols-3 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">{seller.rank}</span>
                  </div>
                  <span className="text-sm font-medium">{seller.name}</span>
                </div>
                <div className="text-center">
                  <span className="text-destructive font-bold">10</span>
                </div>
                <div className="text-center">
                  <Badge variant="destructive" className="font-bold">
                    {seller.points}
                  </Badge>
                </div>
              </div>
            ))}

            {/* Fill empty rows if less than 3 sellers */}
            {Array.from({ length: Math.max(0, 3 - topSellers.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-card border border-border p-3 grid grid-cols-3 items-center opacity-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">{topSellers.length + index + 1}</span>
                  </div>
                  <span className="text-sm">Ingen</span>
                </div>
                <div className="text-center">
                  <span className="text-destructive font-bold">0</span>
                </div>
                <div className="text-center">
                  <Badge variant="outline">0</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};