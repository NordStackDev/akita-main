import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Phone, Mail, Calendar, Users } from "lucide-react";

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

interface Organization {
  id: string;
  name: string;
  created_at: string;
  users?: User[];
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
}

interface CompanyDetailsDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompanyDetailsDialog: React.FC<CompanyDetailsDialogProps> = ({
  company,
  open,
  onOpenChange,
}) => {
  if (!company) return null;

  const totalUsers = company.organizations?.reduce((sum, org) => sum + (org.users?.length || 0), 0) || 0;
  const totalOrganizations = company.organizations?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {company.logo_url && (
              <img
                src={company.logo_url}
                alt="logo"
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div>
              <div className="text-xl">{company.name}</div>
              {company.company_type && (
                <div className="text-sm text-muted-foreground">{company.company_type}</div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Organisationer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrganizations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Brugere
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Oprettet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {company.created_at ? new Date(company.created_at).toLocaleDateString('da-DK') : 'Ukendt'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Firma Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.cvr && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">CVR</div>
                    <div>{company.cvr}</div>
                  </div>
                )}
                
                {(company.address || company.city || company.postal_code) && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Adresse
                    </div>
                    <div>
                      {company.address && <div>{company.address}</div>}
                      {(company.postal_code || company.city) && (
                        <div>{company.postal_code} {company.city}</div>
                      )}
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefon
                    </div>
                    <div>{company.phone}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizations */}
          {company.organizations && company.organizations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Organisationer ({totalOrganizations})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {company.organizations.map((org) => (
                    <div key={org.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{org.name}</h4>
                          <div className="text-xs text-muted-foreground">
                            Oprettet: {new Date(org.created_at).toLocaleDateString('da-DK')}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {org.users?.length || 0} brugere
                        </Badge>
                      </div>

                      {/* Users in organization */}
                      {org.users && org.users.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">Brugere:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {org.users.map((user) => (
                              <div
                                key={user.id}
                                className="flex justify-between items-center p-2 bg-secondary/30 rounded text-sm"
                              >
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {user.user_roles?.name}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDetailsDialog;