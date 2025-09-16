import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
}

interface CompanyEditDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated: () => void;
}

const CompanyEditDialog: React.FC<CompanyEditDialogProps> = ({
  company,
  open,
  onOpenChange,
  onCompanyUpdated,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    cvr: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    company_type: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        cvr: company.cvr || "",
        address: company.address || "",
        city: company.city || "",
        postal_code: company.postal_code || "",
        phone: company.phone || "",
        company_type: company.company_type || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: formData.name,
          cvr: formData.cvr || null,
          address: formData.address || null,
          city: formData.city || null,
          postal_code: formData.postal_code || null,
          phone: formData.phone || null,
          company_type: formData.company_type || null,
          logo_url: formData.logo_url || null,
        })
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Firma opdateret succesfuldt");
      onCompanyUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(`Fejl ved opdatering: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rediger Firma</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Firma navn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Indtast firma navn"
            />
          </div>

          <div>
            <Label htmlFor="cvr">CVR</Label>
            <Input
              id="cvr"
              value={formData.cvr}
              onChange={(e) => setFormData({ ...formData, cvr: e.target.value })}
              placeholder="Indtast CVR nummer"
            />
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Indtast adresse"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="postal_code">Postnummer</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="0000"
              />
            </div>
            <div>
              <Label htmlFor="city">By</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Indtast by"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Indtast telefonnummer"
            />
          </div>

          <div>
            <Label htmlFor="company_type">Firma type</Label>
            <Input
              id="company_type"
              value={formData.company_type}
              onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
              placeholder="F.eks. ApS, A/S, etc."
            />
          </div>

          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuller
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.name.trim()}
          >
            {loading ? "Gemmer..." : "Gem ændringer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyEditDialog;