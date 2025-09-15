import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  MapPin, 
  Plus, 
  Search, 
  Star,
  Clock,
  Users,
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// No props needed - user data comes from context

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  most_used: boolean;
  standplaces: Standplace[];
}

interface Standplace {
  id: string;
  name: string;
  primary_target_group: string;
  best_day: string;
  best_time: string;
}

export const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          standplaces (*)
        `)
        .order('most_used', { ascending: false })
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente lokationer",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async () => {
    if (!newLocation.name || !newLocation.city) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Udfyld venligst navn og by",
      });
      return;
    }

    try {
      // For demo purposes, we'll use a default office_id
      // In a real app, this would come from the user's assigned office
      const { error } = await supabase
        .from('locations')
        .insert({
          name: newLocation.name,
          address: newLocation.address,
          city: newLocation.city,
          postal_code: newLocation.postalCode,
          office_id: 'demo-office-id' // This would be dynamic in production
        });

      if (error) throw error;

      toast({
        title: "Lokation oprettet!",
        description: `${newLocation.name} er blevet tilføjet`,
      });

      setNewLocation({ name: '', address: '', city: '', postalCode: '' });
      setShowCreateDialog(false);
      fetchLocations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fejl ved oprettelse",
        description: error.message || "Der opstod en fejl",
      });
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Indlæser lokationer...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lokationer</h1>
            <p className="text-muted-foreground">Vælg din arbejdslokation og standplads</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0 akita-gradient hover:akita-glow">
                <Plus className="h-4 w-4 mr-2" />
                Ny lokation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Opret ny lokation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="locationName">Navn</Label>
                  <Input
                    id="locationName"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-input border-border"
                    placeholder="F.eks. Strøget København"
                  />
                </div>
                <div>
                  <Label htmlFor="locationAddress">Adresse</Label>
                  <Input
                    id="locationAddress"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-input border-border"
                    placeholder="Strøget 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationPostal">Postnummer</Label>
                    <Input
                      id="locationPostal"
                      value={newLocation.postalCode}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="bg-input border-border"
                      placeholder="1100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationCity">By</Label>
                    <Input
                      id="locationCity"
                      value={newLocation.city}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                      className="bg-input border-border"
                      placeholder="København"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">
                    Annuller
                  </Button>
                  <Button onClick={createLocation} className="flex-1 akita-gradient">
                    Opret lokation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg efter lokationer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-input border-border"
          />
        </div>

        {/* Locations Grid */}
        {filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="akita-card border-border hover:akita-glow akita-transition cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      <CardTitle className="text-foreground text-lg">{location.name}</CardTitle>
                    </div>
                    {location.most_used && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Populær
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {location.address && `${location.address}, `}
                    {location.postal_code} {location.city}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {location.standplaces && location.standplaces.length > 0 ? (
                      <>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          {location.standplaces.length} standpladser tilgængelige
                        </div>
                        
                        <div className="space-y-2">
                          {location.standplaces.slice(0, 2).map((standplace) => (
                            <div key={standplace.id} className="bg-input p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">{standplace.name}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              {standplace.primary_target_group && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Target: {standplace.primary_target_group}
                                </p>
                              )}
                              {standplace.best_time && (
                                <div className="flex items-center mt-1">
                                  <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                                  <span className="text-xs text-muted-foreground">
                                    {standplace.best_time}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {location.standplaces.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{location.standplaces.length - 2} flere standpladser
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Ingen standpladser endnu</p>
                      </div>
                    )}
                    
                    <Button className="w-full akita-gradient hover:akita-glow">
                      Vælg denne lokation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ingen lokationer fundet</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? "Prøv at justere din søgning eller opret en ny lokation"
                : "Opret den første lokation for at komme i gang"
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="akita-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Opret lokation
            </Button>
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 akita-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">Om lokationer</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>FM (Field Marketing):</strong> Vælg både lokation og specifik standplads</p>
              <p>• <strong>TM (Telemarketing):</strong> Vælg kun kontor, ingen standplads nødvendig</p>
              <p>• Populære lokationer er markeret med en stjerne</p>
              <p>• Du kan oprette nye lokationer hvis de ikke findes i listen</p>
            </div>
          </CardContent>
        </Card>
      </main>
  );
};