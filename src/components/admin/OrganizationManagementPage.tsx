import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  Users,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import CompanyEditDialog from "./CompanyEditDialog";
import CompanyDeleteDialog from "./CompanyDeleteDialog";
import CompanyDetailsDialog from "./CompanyDetailsDialog";
import OrganizationDeleteDialog from "./OrganizationDeleteDialog";

interface Organization {
  id: string;
  name: string;
  created_at: string;
  company_id: string | null;
  users?: User[];
  deleted_at?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  user_roles: {
    name: string;
    level: number;
  };
}

interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  cvr?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  company_type?: string | null;
  created_at?: string;
  organizations?: Organization[];
  deleted_at?: string;
}

export const OrganizationManagementPage = () => {
  const [deleteOrganization, setDeleteOrganization] =
    useState<Organization | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Dialog states
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompaniesWithOrganizations();
  }, []);

  const refreshData = () => {
    fetchCompaniesWithOrganizations();
  };

  const fetchCompaniesWithOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select(
          `
          id, name, logo_url, cvr, address, city, postal_code, phone, company_type, created_at,
          organizations (id, name, created_at, company_id,
            users (id, first_name, last_name, name, email, user_roles(name, level))
          )
        `
        )
        .order("created_at", { ascending: false });

      if (companiesError) {
        setError(`Kunne ikke hente firmaer: ${companiesError.message}`);
        setLoading(false);
        return;
      }

      setCompanies(companiesData || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Uventet fejl ved hentning af firmaer.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    if (!search) return companies;
    const lower = search.toLowerCase();
    return companies.filter((c) => {
      return (
        c.name?.toLowerCase().includes(lower) ||
        c.cvr?.toLowerCase().includes(lower) ||
        c.city?.toLowerCase().includes(lower) ||
        c.organizations?.some((o) => o.name.toLowerCase().includes(lower))
      );
    });
  }, [search, companies]);

  const getTotalUsers = (company: Company) => {
    return (
      company.organizations?.reduce(
        (acc, org) => acc + (org.users?.length || 0),
        0
      ) || 0
    );
  };

  return (
    <div>
      <OrganizationDeleteDialog
        organization={deleteOrganization}
        open={!!deleteOrganization}
        onOpenChange={(open) => !open && setDeleteOrganization(null)}
        onOrganizationDeleted={refreshData}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin: Firmaer & Organisationer</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Søg efter firmaer, CVR, by eller organisationer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Indlæser firmaer og organisationer...</div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Ingen firmaer fundet</h3>
          <p className="text-muted-foreground">
            {search
              ? "Prøv at justere din søgning"
              : "Der er endnu ingen firmaer oprettet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredCompanies.map((company) => {
            const totalUsers = getTotalUsers(company);
            const totalOrganizations = company.organizations?.length || 0;
            return (
              <Card
                key={company.id}
                className="border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {company.logo_url && (
                        <img
                          src={company.logo_url}
                          alt="logo"
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <CardTitle className="text-xl">
                          {company.name}
                        </CardTitle>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          {company.cvr && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              CVR: {company.cvr}
                            </span>
                          )}
                          {(company.city || company.address) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.city || company.address}
                            </span>
                          )}
                          {company.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {company.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailsCompany(company)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Detaljer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditCompany(company)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Rediger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteCompany(company)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Slet
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mt-4">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Building2 className="w-3 h-3" />
                      {totalOrganizations} organisationer
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {totalUsers} brugere
                    </Badge>
                    {company.created_at && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        {new Date(company.created_at).toLocaleDateString(
                          "da-DK"
                        )}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Organisationer ({totalOrganizations})
                      </h3>
                      {company.organizations &&
                      company.organizations.length > 0 ? (
                        <div className="grid gap-4">
                          {company.organizations.map((org) => (
                            <Card
                              key={org.id}
                              className="border border-border bg-secondary/20"
                            >
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">
                                    {org.name}
                                  </CardTitle>
                                  <div className="flex gap-2 items-center">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {org.users?.length || 0} brugere
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive border-destructive hover:bg-destructive/10"
                                      onClick={() => setDeleteOrganization(org)}
                                    >
                                      <Trash2 className="w-3 h-3" /> Slet
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Oprettet:{" "}
                                  {new Date(org.created_at).toLocaleDateString(
                                    "da-DK"
                                  )}
                                </div>
                                {/* Users in this organization */}
                                {org.users && org.users.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                      Brugere:
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {org.users.slice(0, 3).map((user) => (
                                        <div
                                          key={user.id}
                                          className="text-xs p-2 bg-background/50 rounded flex justify-between items-center"
                                        >
                                          <div>
                                            <div className="font-medium">
                                              {user.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                              {user.email}
                                            </div>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {user.user_roles?.name}
                                          </Badge>
                                        </div>
                                      ))}
                                      {org.users.length > 3 && (
                                        <div className="text-xs text-muted-foreground text-center py-1">
                                          +{org.users.length - 3} flere brugere
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Ingen brugere i denne organisation
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <div className="text-sm text-muted-foreground">
                            Ingen organisationer tilknyttet dette firma
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CompanyEditDialog
        company={editCompany}
        open={!!editCompany}
        onOpenChange={(open) => !open && setEditCompany(null)}
        onCompanyUpdated={refreshData}
      />
      <CompanyDeleteDialog
        company={deleteCompany}
        open={!!deleteCompany}
        onOpenChange={(open) => !open && setDeleteCompany(null)}
        onCompanyDeleted={refreshData}
      />
      <CompanyDetailsDialog
        company={detailsCompany}
        open={!!detailsCompany}
        onOpenChange={(open) => !open && setDetailsCompany(null)}
      />
    </div>
  );
};
