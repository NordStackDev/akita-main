import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  getSoftDeletedOrganizations, 
  getSoftDeletedCompanies, 
  getSoftDeletedUsers,
  restoreOrganization,
  restoreCompany,
  restoreUser
} from "@/lib/soft-delete";
import { RotateCcw, Trash, Calendar } from "lucide-react";

interface SoftDeletedRecord {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  deleted_at: string;
}

const SoftDeleteRecovery: React.FC = () => {
  const [organizations, setOrganizations] = useState<SoftDeletedRecord[]>([]);
  const [companies, setCompanies] = useState<SoftDeletedRecord[]>([]);
  const [users, setUsers] = useState<SoftDeletedRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSoftDeletedRecords();
  }, []);

  const fetchSoftDeletedRecords = async () => {
    setLoading(true);
    try {
      const [orgsResult, companiesResult, usersResult] = await Promise.all([
        getSoftDeletedOrganizations(),
        getSoftDeletedCompanies(),
        getSoftDeletedUsers()
      ]);

      setOrganizations(orgsResult.data || []);
      setCompanies(companiesResult.data || []);
      setUsers(usersResult.data || []);
    } catch (error) {
      console.error("Error fetching soft deleted records:", error);
      toast.error("Kunne ikke hente slettede poster");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type: 'organization' | 'company' | 'user', id: string, name: string) => {
    try {
      let result;
      switch (type) {
        case 'organization':
          result = await restoreOrganization(id);
          break;
        case 'company':
          result = await restoreCompany(id);
          break;
        case 'user':
          result = await restoreUser(id);
          break;
      }

      if (result.error) throw result.error;

      toast.success(`${name} er blevet gendannet`);
      await fetchSoftDeletedRecords();
    } catch (error: any) {
      console.error("Error restoring record:", error);
      toast.error(`Kunne ikke gendanne ${name}: ${error.message}`);
    }
  };

  const formatDeletedAt = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK');
  };

  const RecordList: React.FC<{
    records: SoftDeletedRecord[];
    type: 'organization' | 'company' | 'user';
    title: string;
  }> = ({ records, type, title }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trash className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{records.length}</Badge>
      </div>
      
      {records.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">
              Ingen slettede {title.toLowerCase()} fundet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">
                      {record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim()}
                    </h4>
                    {record.email && (
                      <p className="text-sm text-muted-foreground">{record.email}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Slettet: {formatDeletedAt(record.deleted_at)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(
                      type, 
                      record.id, 
                      record.name || `${record.first_name || ''} ${record.last_name || ''}`.trim()
                    )}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Gendan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Indlæser slettede poster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Gendan Slettede Data
          </CardTitle>
          <CardDescription>
            Her kan du gendanne data der er blevet slettet ved en fejl. 
            Alle sletninger er "soft deletes" som kan gendannes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchSoftDeletedRecords}
            variant="outline"
            className="mb-4"
          >
            Opdater liste
          </Button>
          
          <Tabs defaultValue="organizations" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="organizations">
                Organisationer ({organizations.length})
              </TabsTrigger>
              <TabsTrigger value="companies">
                Firmaer ({companies.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                Brugere ({users.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="organizations">
              <RecordList 
                records={organizations} 
                type="organization" 
                title="Organisationer" 
              />
            </TabsContent>
            
            <TabsContent value="companies">
              <RecordList 
                records={companies} 
                type="company" 
                title="Firmaer" 
              />
            </TabsContent>
            
            <TabsContent value="users">
              <RecordList 
                records={users} 
                type="user" 
                title="Brugere" 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoftDeleteRecovery;