import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Briefcase, 
  Crown, 
  Building,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Save,
  Users,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  cvr?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  company_type?: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  organizations: Array<{
    id: string;
    name: string;
  }>;
}

interface CompanyStats {
  totalOrganizations: number;
  totalEmployees: number;
  totalSales: number;
  totalRevenue: number;
}

export const CEOCompany = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [stats, setStats] = useState<CompanyStats>({
    totalOrganizations: 0,
    totalEmployees: 0,
    totalSales: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<CompanyData>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization and company info
      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          organization_id,
          organizations (
            company_id,
            companies (
              id,
              name,
              cvr,
              address,
              city,
              postal_code,
              phone,
              company_type,
              primary_color,
              secondary_color,
              created_at,
              organizations (
                id,
                name
              )
            )
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (!profile?.organizations?.companies) return;

      const company = profile.organizations.companies;
      setCompanyData(company);
      setEditData(company);

      // Calculate stats
      const totalOrganizations = company.organizations?.length || 0;

      // Get total employees across all organizations
      let totalEmployees = 0;
      let totalSales = 0;

      for (const org of company.organizations || []) {
        const { data: employees } = await supabase
          .from("users")
          .select("id")
          .eq("organization_id", org.id);

        totalEmployees += employees?.length || 0;

        // Get sales for this organization
        const { data: sales } = await supabase
          .from("sales")
          .select("id, amount")
          .in("user_id", employees?.map(e => e.id) || []);

        totalSales += sales?.length || 0;
      }

      setStats({
        totalOrganizations,
        totalEmployees,
        totalSales,
        totalRevenue: totalSales * 1000 // Dummy calculation
      });
    } catch (error) {
      console.error("Error fetching company data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente virksomhedsdata",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyData?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: editData.name,
          cvr: editData.cvr,
          address: editData.address,
          city: editData.city,
          postal_code: editData.postal_code,
          phone: editData.phone,
          company_type: editData.company_type,
          primary_color: editData.primary_color,
          secondary_color: editData.secondary_color
        })
        .eq("id", companyData.id);

      if (error) throw error;

      toast({
        title: "Gemt",
        description: "Virksomhedsoplysninger er blevet opdateret",
      });

      setEditing(false);
      fetchCompanyData();
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke gemme ændringerne",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen virksomhedsdata fundet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-blue-500" />
            Virksomhed
          </h1>
          <p className="text-muted-foreground">Administrer din virksomheds oplysninger</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Annuller
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Gemmer..." : <><Save className="h-4 w-4 mr-2" />Gem</>}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rediger
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisationer</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">Aktive afdelinger</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medarbejdere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">På tværs af alle afdelinger</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Estimeret Omsætning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} kr</div>
            <p className="text-xs text-muted-foreground">Baseret på salg</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Virksomhedsoplysninger
            </CardTitle>
            <CardDescription>
              Grundlæggende information om din virksomhed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Virksomhedsnavn</Label>
              {editing ? (
                <Input
                  id="companyName"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              ) : (
                <p className="text-lg font-semibold">{companyData.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cvr">CVR-nummer</Label>
              {editing ? (
                <Input
                  id="cvr"
                  value={editData.cvr || ""}
                  onChange={(e) => setEditData({ ...editData, cvr: e.target.value })}
                />
              ) : (
                <p>{companyData.cvr || "Ikke angivet"}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyType">Virksomhedstype</Label>
              {editing ? (
                <Input
                  id="companyType"
                  value={editData.company_type || ""}
                  onChange={(e) => setEditData({ ...editData, company_type: e.target.value })}
                />
              ) : (
                <p>{companyData.company_type || "Ikke angivet"}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Oprettet: {new Date(companyData.created_at).toLocaleDateString("da-DK")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Kontaktoplysninger
            </CardTitle>
            <CardDescription>
              Adresse og kontaktinformation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Adresse</Label>
              {editing ? (
                <Input
                  id="address"
                  value={editData.address || ""}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              ) : (
                <p>{companyData.address || "Ikke angivet"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postnummer</Label>
                {editing ? (
                  <Input
                    id="postalCode"
                    value={editData.postal_code || ""}
                    onChange={(e) => setEditData({ ...editData, postal_code: e.target.value })}
                  />
                ) : (
                  <p>{companyData.postal_code || "Ikke angivet"}</p>
                )}
              </div>
              <div>
                <Label htmlFor="city">By</Label>
                {editing ? (
                  <Input
                    id="city"
                    value={editData.city || ""}
                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  />
                ) : (
                  <p>{companyData.city || "Ikke angivet"}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              {editing ? (
                <Input
                  id="phone"
                  value={editData.phone || ""}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              ) : (
                <p>{companyData.phone || "Ikke angivet"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Organisationer</CardTitle>
          <CardDescription>Alle afdelinger i virksomheden</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyData.organizations?.map((org) => (
              <div key={org.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="font-medium">{org.name}</span>
                </div>
              </div>
            ))}
          </div>
          {(!companyData.organizations || companyData.organizations.length === 0) && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ingen organisationer fundet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};