import React, { useState } from "react";
import { softDeleteOrganization } from "@/lib/soft-delete";
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

interface Organization {
  id: string;
  name: string;
  company_id: string | null;
  deleted_at?: string;
}

interface OrganizationDeleteDialogProps {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationDeleted: () => void;
}

const OrganizationDeleteDialog: React.FC<OrganizationDeleteDialogProps> = ({
  organization,
  open,
  onOpenChange,
  onOrganizationDeleted,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      // Soft delete organisationen
      const { error: orgError } = await softDeleteOrganization(organization.id);
      if (orgError) throw orgError;
      toast.success("Organisation slettet (soft delete)");
      onOrganizationDeleted();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        "Kunne ikke slette organisation: " + (error.message || "Ukendt fejl")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bekræft sletning</AlertDialogTitle>
           <AlertDialogDescription>
             Er du sikker på, at du vil slette organisationen{" "}
             <b>{organization?.name}</b>? Organisationen vil blive soft slettet og kan gendannes.
           </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuller</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-white"
          >
            Slet organisation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OrganizationDeleteDialog;
