import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { softDeleteOrganization } from "@/lib/soft-delete";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Crown, 
  Plus,
  Users,
  BarChart3,
  Edit2,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Organization {
  id: string;
  name: string;
  company_id: string;
  created_at: string;
  member_count?: number;
  total_sales?: number;
}

interface CompanyInfo {
  id: string;
  name: string;
  created_at: string;
}

export const CEOOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizationsData();
  }, []);

  const fetchOrganizationsData = async () => {
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
              created_at
            )
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (!profile?.organizations?.companies) return;

      const company = profile.organizations.companies;
      setCompanyInfo(company);

      // Get all organizations for this company (excluding soft deleted)
      const { data: orgs } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          company_id,
          created_at,
          deleted_at
        `)
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (orgs) {
        // Get member count and sales data for each organization
        const orgsWithStats = await Promise.all(
          orgs.map(async (org) => {
            // Get member count (excluding soft deleted users)
            const { data: members } = await supabase
              .from("users")
              .select("id")
              .eq("organization_id", org.id)
              .is("deleted_at", null);

            // Get total sales for this organization (excluding soft deleted sales)
            const { data: sales } = await supabase
              .from("sales")
              .select("id")
              .in("user_id", members?.map(m => m.id) || [])
              .is("deleted_at", null);

            return {
              ...org,
              member_count: members?.length || 0,
              total_sales: sales?.length || 0
            };
          })
        );

        setOrganizations(orgsWithStats);
      }
    } catch (error) {
      console.error("Error fetching organizations data:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke hente organisations data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim() || !companyInfo) return;

    setCreatingOrg(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .insert({
          name: newOrgName.trim(),
          company_id: companyInfo.id
        });

      if (error) throw error;

      toast({
        title: "Organisation oprettet",
        description: `${newOrgName} er blevet oprettet`,
      });

      setNewOrgName("");
      setShowCreateDialog(false);
      fetchOrganizationsData();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke oprette organisation",
      });
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${orgName}"? Organisationen vil blive soft slettet og kan gendannes.`)) {
      return;
    }

    try {
      // Soft delete the organization
      const { error } = await softDeleteOrganization(orgId);

      if (error) throw error;

      toast({
        title: "Organisation slettet",
        description: `${orgName} er blevet soft slettet og kan gendannes`,
      });

      fetchOrganizationsData();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke slette organisation",
      });
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-8 w-8 text-blue-500" />
            Organisationer
          </h1>
          <p className="text-muted-foreground">
            Administrer organisationer i {companyInfo?.name || 'din virksomhed'}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ny Organisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret Ny Organisation</DialogTitle>
              <DialogDescription>
                Opret en ny organisation under {companyInfo?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organisations Navn</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Indtast organisations navn"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Annuller
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={!newOrgName.trim() || creatingOrg}
              >
                {creatingOrg ? "Opretter..." : "Opret Organisation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Company Overview */}
      {companyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Virksomhed
            </CardTitle>
            <CardDescription>Din virksomheds oversigt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-semibold">{companyInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Oprettet: {new Date(companyInfo.created_at).toLocaleDateString("da-DK")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{organizations.length}</p>
                <p className="text-sm text-muted-foreground">Organisationer</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {organizations.reduce((sum, org) => sum + (org.member_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Medarbejdere</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <Card key={org.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{org.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteOrganization(org.id, org.name)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Oprettet: {new Date(org.created_at).toLocaleDateString("da-DK")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Medarbejdere</span>
                  </div>
                  <Badge variant="secondary">{org.member_count}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Total Salg</span>
                  </div>
                  <Badge variant="secondary">{org.total_sales}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen organisationer endnu</p>
            <p className="text-sm text-muted-foreground mb-4">
              Opret din første organisation for at komme i gang
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opret Organisation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};