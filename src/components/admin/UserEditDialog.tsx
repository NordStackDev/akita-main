import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";

interface UserEditDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
  roles: { name: string; level: number }[];
  organizations: { id: string; name: string }[];
}


// Helper: fetch full user profile (including profile fields)
async function fetchFullUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id, first_name, last_name, email, role_id, organization_id, status,
      user_roles(name, level),
  profiles(profile_image_url)
    `)
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}


export const UserEditDialog: React.FC<UserEditDialogProps> = ({ user, open, onOpenChange, onUserUpdated, roles, organizations }) => {
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch full user info when dialog opens or user changes
  useEffect(() => {
    if (user && open) {
      setLoading(true);
      fetchFullUser(user.id)
        .then((data) => {
          const profile: any = typeof data.profiles === "object" && data.profiles !== null ? data.profiles : {};
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            role: data.user_roles?.name || "",
            organization_id: data.organization_id || "",
            status: data.status || "active",
            profile_image_url: profile.profile_image_url || "",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [user, open]);

  const handleChange = (field: string, value: string) => {
    setForm((f: any) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Update users table
    await supabase
      .from("users")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role_id: String(roles.find((r) => r.name === form.role)?.level ?? ""),
        organization_id: form.organization_id,
        status: form.status
      })
      .eq("id", user.id);
    // Update profiles table
    await supabase
      .from("profiles")
      .update({
        profile_image_url: form.profile_image_url || null
      })
      .eq("user_id", user.id);
    setSaving(false);
    onUserUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rediger bruger</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Indlæser brugerdata...</div>
        ) : (
          <div className="grid gap-3">
            <Input
              value={form.first_name || ""}
              onChange={(e) => handleChange("first_name", e.target.value)}
              placeholder="Fornavn"
            />
            <Input
              value={form.last_name || ""}
              onChange={(e) => handleChange("last_name", e.target.value)}
              placeholder="Efternavn"
            />
            <Input
              value={form.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Email"
            />
            <div>
              <div className="flex gap-2 items-center">
                {form.profile_image_url && (
                  <img
                    src={form.profile_image_url}
                    alt="Avatar preview"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploader..." : "Upload billede"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const fileExt = file.name.split('.').pop();
                    const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
                    if (!uploadError) {
                      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                      if (urlData?.publicUrl) {
                        setForm((f: any) => ({ ...f, profile_image_url: urlData.publicUrl }));
                      }
                    }
                    setUploading(false);
                  }}
                />
              </div>
            </div>
            <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg rolle" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.organization_id} onValueChange={(v) => handleChange("organization_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg organisation" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="deleted">Slettet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Gemmer..." : "Gem ændringer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
