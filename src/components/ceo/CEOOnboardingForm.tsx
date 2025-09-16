import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Building, CreditCard, MapPin, Phone } from "lucide-react";

interface CEOOnboardingFormProps {
  onComplete: () => void;
}

export const CEOOnboardingForm = ({ onComplete }: CEOOnboardingFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    cvr: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    companyType: "" // TM or FM
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Ikke autoriseret",
          description: "Du skal være logget ind",
        });
        return;
      }

      // Get CEO role first so RLS allows company creation
      const { data: ceoRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("name", "ceo")
        .single();

      if (!ceoRole) {
        throw new Error("CEO rolle ikke fundet");
      }

      // Ensure current user has CEO role before creating company
      const { error: setRoleError } = await supabase
        .from("users")
        .update({
          role_id: ceoRole.id,
        })
        .eq("id", user.id);

      if (setRoleError) {
        throw setRoleError;
      }

      // Use the new secure function to create company and organization
      const { data: companyId, error: companyError } = await supabase
        .rpc("create_company_for_current_user", {
          _name: formData.companyName,
          _cvr: formData.cvr,
          _address: formData.address,
          _city: formData.city,
          _postal_code: formData.postalCode,
          _phone: formData.phone,
          _company_type: formData.companyType,
          _primary_color: "#ff0000",
          _secondary_color: "#1c1c1c"
        });

      if (companyError) {
        throw companyError;
      }

      toast({
        title: "Firma oprettet!",
        description: `${formData.companyName} er nu oprettet som ${formData.companyType} firma. Du kan nu oprette teams og invitere medarbejdere.`,
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        variant: "destructive",
        title: "Fejl ved oprettelse",
        description: error.message || "Kunne ikke oprette firma",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl akita-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-foreground">
            <Building className="w-6 h-6" />
            Opret dit firma
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Velkommen! Indtast oplysninger om dit firma for at komme i gang. Du kan senere oprette teams/organisationer under firmaet.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium">
                Firmanavn *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Dit firmanavn"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cvr" className="text-sm font-medium">
                  CVR nummer *
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cvr"
                    type="text"
                    value={formData.cvr}
                    onChange={(e) => handleInputChange("cvr", e.target.value)}
                    className="pl-10 bg-input border-border"
                    placeholder="12345678"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyType" className="text-sm font-medium">
                  Firma type *
                </Label>
                <Select value={formData.companyType} onValueChange={(value) => handleInputChange("companyType", value)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Vælg firma type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TM">TM (Telemarketing)</SelectItem>
                    <SelectItem value="FM">FM (Field Marketing)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Adresse *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Gadenavn og nummer"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Postnummer *
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  className="bg-input border-border"
                  placeholder="1234"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  By *
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="bg-input border-border"
                  placeholder="Bynavn"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Telefon (valgfrit)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10 bg-input border-border"
                  placeholder="Telefonnummer"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full akita-gradient hover:akita-glow akita-transition text-lg py-6"
              disabled={loading || !formData.companyName || !formData.cvr || !formData.companyType}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Building className="mr-2 h-5 w-5" />
              )}
              Opret firma
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};