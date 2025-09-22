import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserEditDialog } from "./UserEditDialog";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_roles: { name: string; level: number };
  organization_id?: string;
  profiles?: { profile_image_url?: string };
  deleted_at?: string | null;
}

export const UserAdminTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<{ name: string; level: number }[]>([]);
  const [organizations, setOrganizations] = useState<
    { id: string; name: string }[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchOrganizations();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("name, level");
    if (!error && data) setRoles(data);
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name");
    if (!error && data) setOrganizations(data);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, organization_id, user_roles(name, level), profiles(profile_image_url), deleted_at"
      );
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  // Statistik
  const totalUsers = users.length;
  const deletedUsers = users.filter((u: User) => !!u.deleted_at).length;
  const activeUsers = users.filter((u: User) => !u.deleted_at).length;
  // For simplicity, inactiveUsers = 0 unless der er et felt for det
  const inactiveUsers = 0;

  // Filtrering
  const filteredUsers = users.filter((u: User) => {
    const matchesSearch =
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = !u.deleted_at;
    else if (statusFilter === "deleted") matchesStatus = !!u.deleted_at;
    // "inactive" kan tilføjes hvis felt findes
    return matchesSearch && matchesStatus;
  });

  // Soft delete funktion
  const handleSoftDelete = async (userId: string) => {
    await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);
    fetchUsers();
  };

  return (
    <div className="space-y-8">
      {/* Statistik/Tracking */}
      <div className="flex flex-wrap items-center justify-between bg-background rounded-lg p-3 border mb-6 gap-3">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="inline-flex items-center bg-muted text-foreground text-sm font-medium rounded px-3 py-1">
            Total: {totalUsers}
          </span>
          <span className="inline-flex items-center bg-muted text-foreground text-sm font-medium rounded px-3 py-1">
            Aktive: {activeUsers}
          </span>
          <span className="inline-flex items-center bg-muted text-foreground text-sm font-medium rounded px-3 py-1">
            Inaktive: {inactiveUsers}
          </span>
          <span className="inline-flex items-center bg-muted text-foreground text-sm font-medium rounded px-3 py-1">
            Slettede: {deletedUsers}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="font-medium text-sm">Status:</span>
          <select
            className="border rounded px-2 py-1 text-sm bg-background focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Alle</option>
            <option value="active">Aktiv</option>
            <option value="inactive">Inaktiv</option>
            <option value="deleted">Slettet</option>
          </select>
        </div>
      </div>
      <div className="mb-6 max-w-lg">
        <Input
          placeholder="Søg efter brugere..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="text-center text-lg py-8 text-muted-foreground">
          Indlæser brugere...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Ingen brugere fundet
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="transition-shadow hover:shadow-lg border bg-card rounded-xl px-2 py-2"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4 w-full min-w-0">
                  <Avatar className="h-12 w-12 shadow border border-primary/30">
                    <AvatarImage
                      src={user.profiles?.profile_image_url || undefined}
                    />
                    <AvatarFallback className="text-lg font-bold">
                      {user.first_name?.charAt(0) ||
                        user.email?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-base font-semibold truncate">
                      {user.first_name} {user.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs px-3 py-0.5 capitalize tracking-wide rounded-full bg-primary/10 text-primary border-0"
                      >
                        {user.user_roles?.name}
                      </Badge>
                      <Badge
                        className={`text-xs px-3 py-0.5 rounded-full ${
                          user.deleted_at
                            ? "bg-destructive/20 text-destructive"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.deleted_at ? "Slettet" : "Aktiv"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2 items-center mt-4 sm:mt-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2 rounded-full px-4 py-2 font-medium text-sm bg-primary/90 text-white hover:bg-primary focus:ring-2 focus:ring-primary/40 transition-all shadow-sm"
                    onClick={() => setEditUser(user)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Rediger
                  </Button>
                  {!user.deleted_at && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-full px-4 py-2 font-medium text-xs"
                      onClick={() => handleSoftDelete(user.id)}
                    >
                      Slet
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* User Edit Dialog */}
      <UserEditDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onUserUpdated={() => {
          setEditUser(null);
          fetchUsers();
        }}
        roles={roles}
        organizations={organizations}
      />
    </div>
  );
};
