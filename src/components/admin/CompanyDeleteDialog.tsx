import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  organizations?: any[];
}

interface CompanyDeleteDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyDeleted: () => void;
}

const CompanyDeleteDialog: React.FC<CompanyDeleteDialogProps> = ({
  company,
  open,
  onOpenChange,
  onCompanyDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!company) return;

    setLoading(true);
    try {
      // Check if company has organizations
      const totalOrganizations = company.organizations?.length || 0;
      
      if (totalOrganizations > 0) {
        toast.error("Kan ikke slette firma med eksisterende organisationer. Slet organisationerne først.");
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);

      if (error) throw error;

      toast.success("Firma slettet succesfuldt");
      onCompanyDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(`Fejl ved sletning: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slet firma</AlertDialogTitle>
          <AlertDialogDescription>
            Er du sikker på, at du vil slette firmaet "{company?.name}"?
            <br />
            <br />
            {company?.organizations && company.organizations.length > 0 && (
              <span className="text-orange-600 font-medium">
                Advarsel: Dette firma har {company.organizations.length} organisationer tilknyttet. 
                Du skal slette alle organisationer først.
              </span>
            )}
            {(!company?.organizations || company.organizations.length === 0) && (
              <span className="text-red-600 font-medium">
                Denne handling kan ikke fortrydes.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuller</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || (company?.organizations && company.organizations.length > 0)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Sletter..." : "Slet firma"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CompanyDeleteDialog;