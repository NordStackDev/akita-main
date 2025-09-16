import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Settings, Crown, Users as UsersIcon } from "lucide-react";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_roles: {
    name: string;
    level: number;
  };
  profiles: {
    profile_image_url?: string;
  };
  sales_count?: number;
  total_points?: number;
}

interface UserRole {
  id: string;
  name: string;
  level: number;
}

interface TeamManagementProps {
  teamMembers: TeamMember[];
  onRoleChange: (userId: string, newRoleId: string) => void;
}

export const TeamManagement = ({ teamMembers, onRoleChange }: TeamManagementProps) => {
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("id, name, level")
        .gte("level", 5) // Only roles from team lead and below
        .lte("level", 8) // Exclude developer and CEO roles
        .order("level", { ascending: true });

      if (roles) {
        setAvailableRoles(roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleRoleUpdate = () => {
    if (selectedMember && selectedRole) {
      onRoleChange(selectedMember, selectedRole);
      setSelectedMember(null);
      setSelectedRole("");
    }
  };

  const getRoleColor = (level: number) => {
    if (level <= 5) return "bg-purple-500";
    if (level <= 6) return "bg-blue-500";
    if (level <= 7) return "bg-green-500";
    return "bg-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Rolle Management
        </CardTitle>
        <CardDescription>
          Opdater roller for dine team medlemmer
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Role Change Section */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Vælg team medlem
            </label>
            <Select value={selectedMember || ""} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en person" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.profiles?.profile_image_url} />
                        <AvatarFallback className="text-xs">
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {member.first_name} {member.last_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Vælg ny rolle
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en rolle" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${getRoleColor(role.level)}`}
                        />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedMember && selectedRole && (
            <Button onClick={handleRoleUpdate} className="w-full">
              Opdater Rolle
            </Button>
          )}
        </div>

        {/* Available Roles Overview */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Tilgængelige Roller</h4>
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${getRoleColor(role.level)}`}
                  />
                  <span className="text-sm font-medium">{role.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Niveau {role.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Note about restricted roles */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Crown className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-yellow-800">
                Bemærk: Developer og CEO roller
              </p>
              <p className="text-xs text-yellow-700">
                Disse roller kan ikke tildeles og skal ansøges om særskilt.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};