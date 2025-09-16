import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Organization {
  id: string;
  name: string;
  created_at: string;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  cvr?: string | null;
  organizations?: Organization[];
}

const OrganizationManagementPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCompaniesWithOrganizations();
  }, []);

  const fetchCompaniesWithOrganizations = async () => {
    setLoading(true);
    setError(null);
    // Fetch all companies and their organizations
    const { data, error } = await supabase
      .from("companies")
      .select(
        `id, name, logo_url, cvr, organizations (id, name, created_at, company_id)`
      ) // join organizations
      .order("created_at", { ascending: false });
    if (error) {
      setError("Kunne ikke hente firmaer og organisationer");
      setLoading(false);
      return;
    }
    setCompanies(data || []);
    setLoading(false);
  };

  // Flat search: match company or org name
  useEffect(() => {
    if (!loading) {
      console.log("[DEBUG] companies:", companies);
    }
  }, [companies, loading]);

  const filteredCompanies = companies
    .map((company) => ({
      ...company,
      organizations: (company.organizations || []).filter(
        (org) =>
          org.name.toLowerCase().includes(search.toLowerCase()) ||
          company.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(
      (company) =>
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        (company.organizations && company.organizations.length > 0)
    );

  useEffect(() => {
    if (!loading) {
      console.log("[DEBUG] filteredCompanies:", filteredCompanies);
    }
  }, [filteredCompanies, loading]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Admin: Firmaer & Organisationer
      </h1>

      {/* Companies overview */}
      <h2 className="text-xl font-semibold mb-2 mt-6">Firmaer</h2>
      {loading ? (
        <div>Indlæser firmaer og organisationer...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredCompanies.length === 0 ? (
        <div>Ingen firmaer eller organisationer fundet.</div>
      ) : (
        <div className="space-y-8">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="border-primary border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {company.logo_url && (
                    <img
                      src={company.logo_url}
                      alt="logo"
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <span>{company.name}</span>
                </CardTitle>
                {company.cvr && (
                  <CardDescription className="ml-2 text-xs text-muted-foreground">
                    CVR: {company.cvr}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="secondary" disabled>
                  Rediger firma
                </Button>
                <div className="mt-4">
                  <h3 className="text-base font-semibold mb-2">
                    Organisationer
                  </h3>
                  {company.organizations && company.organizations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.organizations.map((org) => (
                        <Card key={org.id} className="border border-border">
                          <CardHeader>
                            <CardTitle>{org.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-muted-foreground mb-2">
                              Oprettet:{" "}
                              {new Date(org.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" disabled>
                                Rediger
                              </Button>
                              <Button size="sm" variant="destructive" disabled>
                                Slet
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Ingen organisationer tilknyttet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationManagementPage;
